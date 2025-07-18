from tempfile import TemporaryFile
from types import TracebackType
from typing import Any, BinaryIO, Self

from aiobotocore.session import get_session
from botocore.exceptions import BotoCoreError, ClientError
from types_aiobotocore_s3.client import S3Client

from jamflow.core.config import settings
from jamflow.core.exceptions import StorageError
from jamflow.core.log import bind_log_context, get_logger, unbind_log_context

logger = get_logger()


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
        raise StorageError(
            "Failed to create storage client",
            context={
                "endpoint_url": settings.STORAGE_URL,
                "access_key": settings.STORAGE_ACCESS_KEY,
            },
        ) from exc


class S3StorageService:
    _client: S3Client

    def __init__(self, storage_name: str):
        self._bucket_name = storage_name

    async def store_file(
        self,
        file: bytes | BinaryIO,
        *,
        path: str,
        content_type: str,
    ) -> None:
        try:
            await self._client.put_object(
                Bucket=self._bucket_name,
                Key=path,
                Body=file,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as exc:
            context = {
                "bucket_name": self._bucket_name,
                "path": path,
                "content_type": content_type,
            } | _get_error_context(exc)
            raise StorageError("Failed to store file", context=context) from exc

    async def get_file(self, path: str) -> BinaryIO:
        try:
            response = await self._client.get_object(Bucket=self._bucket_name, Key=path)
            stream = response["Body"]
            temp_file = TemporaryFile(mode="wb+")
            while chunk := await stream.read(1024 * 1024):  # 1MB
                temp_file.write(chunk)
            temp_file.seek(0)
            return temp_file
        except (BotoCoreError, ClientError) as exc:
            context = {
                "bucket_name": self._bucket_name,
                "path": path,
            } | _get_error_context(exc)
            raise StorageError("Failed to get file", context=context) from exc

    async def purge(self) -> None:
        try:
            response = await self._client.list_objects_v2(Bucket=self._bucket_name)
            if "Contents" in response:
                object_count = len(response["Contents"])
                await logger.ainfo(
                    "S3 bucket purge started",
                    object_count=object_count,
                )

                objects = [{"Key": obj["Key"]} for obj in response["Contents"]]
                await self._client.delete_objects(
                    Bucket=self._bucket_name,
                    Delete={"Objects": objects},  # type: ignore [typeddict-item]
                )

                await logger.ainfo(
                    "S3 bucket purge completed",
                    objects_deleted=object_count,
                )
        except (BotoCoreError, ClientError) as exc:
            context = {
                "bucket_name": self._bucket_name,
            } | _get_error_context(exc)
            raise StorageError("Failed to purge bucket", context=context) from exc

    async def generate_expiring_url(self, path: str, expiration: int = 3600) -> str:
        try:
            url = await self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket_name, "Key": path},
                ExpiresIn=expiration,
            )
            return url
        except (BotoCoreError, ClientError) as exc:
            context = {
                "bucket_name": self._bucket_name,
                "path": path,
                "expiration": expiration,
            } | _get_error_context(exc)
            raise StorageError(
                "Failed to generate presigned URL", context=context
            ) from exc

    async def __aenter__(self) -> Self:
        bind_log_context(bucket_name=self._bucket_name)
        self._client = await get_storage_client()
        found = await self._bucket_exists()
        if not found:
            await logger.ainfo("S3 bucket created")
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

            context = {
                "bucket_name": self._bucket_name,
            } | _get_error_context(exc)
            raise StorageError("Failed to access bucket", context=context) from exc
        return True

    async def _bucket_create(self) -> None:
        try:
            await self._client.create_bucket(Bucket=self._bucket_name)
        except ClientError as exc:
            context = {
                "bucket_name": self._bucket_name,
            } | _get_error_context(exc)
            raise StorageError("Failed to create bucket", context=context) from exc


def _get_error_context(exc: BotoCoreError | ClientError) -> dict[str, Any]:
    """
    Extract s3 specific error context from a BotoCoreError or ClientError.
    """
    if hasattr(exc, "response") and "Error" in exc.response:
        return {
            "s3_error_code": exc.response["Error"].get("Code"),
            "s3_error_message": exc.response["Error"].get("Message"),
        }
    return {}
