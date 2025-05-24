import pytest
from types_aiobotocore_s3.client import S3Client

from jamflow.core.config import settings
from jamflow.services.exceptions import StorageException
from jamflow.services.storage.s3 import S3StorageService, get_storage_client

TEST_BUCKET_NAME = "test-storage-service-bucket"

# TODO: test more error cases


@pytest.fixture
async def s3_client() -> S3Client:
    client = await get_storage_client()

    try:
        yield client
    finally:
        await client.close()


@pytest.fixture
async def s3_storage(s3_client: S3Client):
    async with S3StorageService(TEST_BUCKET_NAME) as storage:
        yield storage

    # Delete all files and remove bucket
    objects = await s3_client.list_objects_v2(Bucket=TEST_BUCKET_NAME)
    if "Contents" in objects:
        await s3_client.delete_objects(
            Bucket=TEST_BUCKET_NAME,
            Delete={"Objects": [{"Key": obj["Key"]} for obj in objects["Contents"]]},
        )
    await s3_client.delete_bucket(Bucket=TEST_BUCKET_NAME)


async def test_store_file(s3_storage: S3StorageService, s3_client: S3Client):
    file_data = b"test content"
    await s3_storage.store_file("some_dir/test-file.txt", file_data)

    response = await s3_client.get_object(
        Bucket=TEST_BUCKET_NAME, Key="some_dir/test-file.txt"
    )
    content = await response["Body"].read()

    assert content == file_data


async def test_get_file(s3_storage: S3StorageService, s3_client: S3Client):
    path = "test/test-file.txt"
    content = b"test content"
    await s3_client.put_object(Bucket=TEST_BUCKET_NAME, Key=path, Body=content)

    file = await s3_storage.get_file(path=path)
    with file:
        file_content = file.read()
    assert file_content == content


async def test_get_file_missing(s3_storage: S3StorageService):
    with pytest.raises(StorageException, match="Failed to get file"):
        await s3_storage.get_file(path="nonexistent.txt")


async def test_purge_bucket(s3_storage: S3StorageService, s3_client: S3Client):
    # Store multiple files in the bucket
    await s3_storage.store_file("file1.txt", b"content1")
    await s3_storage.store_file("file2.txt", b"content2")

    # Verify files exist
    response = await s3_client.list_objects_v2(Bucket=TEST_BUCKET_NAME)
    assert "Contents" in response
    assert len(response["Contents"]) == 2

    # Purge the bucket
    await s3_storage.purge()

    # Verify the bucket is empty
    response = await s3_client.list_objects_v2(Bucket=TEST_BUCKET_NAME)
    assert "Contents" not in response


async def test_generate_presigned_url(s3_storage: S3StorageService):
    await s3_storage.store_file("test-file.txt", b"test content")
    url = await s3_storage.generate_expiring_url("test-file.txt")
    assert "test-file.txt" in url
    assert str(settings.STORAGE_URL) in url
