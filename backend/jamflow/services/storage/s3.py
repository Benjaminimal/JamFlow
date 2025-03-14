from types import TracebackType
from typing import IO, Self

from aiobotocore.session import get_session
from botocore.exceptions import BotoCoreError, ClientError
from types_aiobotocore_s3.client import S3Client

from jamflow.core.config import settings
from jamflow.core.log import bind_log_context, get_logger, unbind_log_context
from jamflow.services.exceptions import StorageException

log = get_logger()


async def get_storage_client() -> S3Client:
    session = get_session()
    try:
        async with session.create_client(
            "s3",
            endpoint_url=str(settings.STORAGE_URL),
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
        ) as client:
            return client
    except BotoCoreError as exc:
        log.error("Failed to create s3 client", exc_info=True)
        raise StorageException("Failed to create storage client") from exc


class S3StorageService:
    _client: S3Client

    def __init__(self, storage_name: str):
        self._bucket_name = storage_name

    async def store_file(self, path: str, file: bytes | IO[bytes]) -> None:
        try:
            await self._client.put_object(Bucket=self._bucket_name, Key=path, Body=file)
        except (BotoCoreError, ClientError) as exc:
            log.error("Failed to store file", exc_info=True, path=path)
            raise StorageException(f"Failed to store file {path}") from exc

    async def generate_expiring_url(self, path: str, expiration: int = 3600) -> str:
        try:
            url = await self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket_name, "Key": path},
                ExpiresIn=expiration,
            )
            return url
        except (BotoCoreError, ClientError) as exc:
            log.error("Failed to generate presigned URL", exc_info=True, path=path)
            raise StorageException(
                f"Failed to generate presigned URL for {path}"
            ) from exc
        pass

    async def __aenter__(self) -> Self:
        bind_log_context(bucket_name=self._bucket_name)
        self._client = await get_storage_client()
        found = await self._bucket_exists()
        if not found:
            log.info("Bucket does not exist, creating it")
            await self._bucket_create()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        unbind_log_context("bucket_name")
        if self._client:
            await self._client.close()

    async def _bucket_exists(self) -> bool:
        try:
            await self._client.head_bucket(Bucket=self._bucket_name)
        except ClientError as exc:
            if exc.response.get("Error", {}).get("Code", None) == "404":
                return False
            log.error("Failed to head bucket", exc_info=True)
            raise StorageException(
                f"Unexpected error when trying to access storage {self._bucket_name}"
            ) from exc
        return True

    async def _bucket_create(self) -> None:
        try:
            await self._client.create_bucket(Bucket=self._bucket_name)
        except ClientError as exc:
            log.error("Failed to create bucket", exc_info=True)
            raise StorageException(
                f"Unable to access {self._bucket_name} storage"
            ) from exc
