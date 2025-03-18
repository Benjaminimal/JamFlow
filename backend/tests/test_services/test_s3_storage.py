import pytest
from botocore.client import ClientError
from botocore.exceptions import BotoCoreError
from pytest_mock import MockerFixture
from types_aiobotocore_s3.client import S3Client

from jamflow.core.config import settings
from jamflow.services.exceptions import StorageException
from jamflow.services.storage.s3 import S3StorageService, get_storage_client


@pytest.fixture
def mock_s3_client(mocker: MockerFixture):
    # mock the S3 client used by the S3StorageService
    mock_client = mocker.AsyncMock()
    # make get_storage_client return the mock client
    mock_get = mocker.patch("jamflow.services.storage.s3.get_storage_client")
    mock_get.return_value = mock_client
    return mock_client


@pytest.mark.unit
async def test_invlaid_credentials(mocker: MockerFixture):
    # raise an exception to simulate invalid credentials
    mock_session = mocker.patch("jamflow.services.storage.s3.get_session")
    mock_session.return_value.create_client.side_effect = BotoCoreError()

    with pytest.raises(StorageException):
        async with S3StorageService("test-bucket"):
            pass

    # verify that head_bucket and create_bucket were called
    mock_session.return_value.create_client.assert_called_once()


@pytest.mark.unit
async def test_bucket_not_exists_auto_created(mock_s3_client):
    # raise an exception to simulate a non-existent bucket
    mock_s3_client.head_bucket.side_effect = ClientError({"Error": {"Code": "404"}}, "")

    async with S3StorageService("test-bucket"):
        pass

    # verify that head_bucket and create_bucket were called
    mock_s3_client.head_bucket.assert_called_once_with(Bucket="test-bucket")
    mock_s3_client.create_bucket.assert_called_once_with(Bucket="test-bucket")


@pytest.mark.unit
async def test_bucket_exists_not_auto_created(mock_s3_client):
    # not raise an exception to simulate an existing bucket

    async with S3StorageService("test-bucket"):
        pass

    # verify that we checked for the existence of the bucket but did not create it
    mock_s3_client.head_bucket.assert_called_once_with(Bucket="test-bucket")
    mock_s3_client.create_bucket.assert_not_called()


@pytest.mark.unit
async def test_store_file_success(mock_s3_client):
    # not raise an exception to simulate a successful file storage

    async with S3StorageService("test-bucket") as service:
        await service.store_file("test/path", b"test data")

    # verify that put_object was called with the correct parameters
    mock_s3_client.put_object.assert_called_once_with(
        Bucket="test-bucket", Key="test/path", Body=b"test data"
    )


@pytest.mark.unit
async def test_store_file_failure(mock_s3_client):
    # raise an error on put_object to simulate a failure when storing a file
    mock_s3_client.put_object.side_effect = BotoCoreError()

    async with S3StorageService("test-bucket") as service:
        # verify that a StorageException is raised
        with pytest.raises(StorageException):
            await service.store_file("test/path", b"test data")

    # verify that put_object was called with the correct parameters
    mock_s3_client.put_object.assert_called_once_with(
        Bucket="test-bucket", Key="test/path", Body=b"test data"
    )


@pytest.mark.unit
async def test_generate_expiring_url_success(mock_s3_client):
    # mock the return value of generate_presigned_url
    mock_s3_client.generate_presigned_url.return_value = (
        "http://example.com/presigned-url"
    )

    async with S3StorageService("test-bucket") as service:
        url = await service.generate_expiring_url("test/path")

    # verify that generate_presigned_url was called with the correct parameters
    mock_s3_client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "test-bucket", "Key": "test/path"},
        ExpiresIn=3600,
    )
    assert url == "http://example.com/presigned-url"


@pytest.mark.unit
async def test_generate_expiring_url_failure(mock_s3_client):
    # raise an error on generate_presigned_url to simulate a failure
    mock_s3_client.generate_presigned_url.side_effect = BotoCoreError()

    async with S3StorageService("test-bucket") as service:
        # verify that a StorageException is raised
        with pytest.raises(StorageException):
            await service.generate_expiring_url("test/path")

    # verify that generate_presigned_url was called with the correct parameters
    mock_s3_client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "test-bucket", "Key": "test/path"},
        ExpiresIn=3600,
    )


TEST_BUCKET_NAME = "test-storage-service-bucket"


@pytest.fixture(scope="module")
async def s3_client():
    client = await get_storage_client()

    yield client

    await client.close()


@pytest.fixture(scope="module")
async def s3_storage(s3_client: S3Client):
    async with S3StorageService(TEST_BUCKET_NAME) as storage:
        yield storage

    # Delete all files and remove bucket
    objects = await s3_client.list_objects_v2(Bucket=TEST_BUCKET_NAME)
    if "Contents" in objects:
        for obj in objects["Contents"]:
            await s3_client.delete_object(Bucket=TEST_BUCKET_NAME, Key=obj["Key"])
    await s3_client.delete_bucket(Bucket=TEST_BUCKET_NAME)


@pytest.mark.integration
@pytest.mark.asyncio(loop_scope="module")
async def test_store_file(s3_storage: S3StorageService, s3_client: S3Client):
    file_data = b"test content"
    await s3_storage.store_file("some_dir/test-file.txt", file_data)

    response = await s3_client.get_object(
        Bucket=TEST_BUCKET_NAME, Key="some_dir/test-file.txt"
    )
    content = await response["Body"].read()

    assert content == file_data


@pytest.mark.integration
@pytest.mark.asyncio(loop_scope="module")
async def test_generate_presigned_url(s3_storage: S3StorageService):
    await s3_storage.store_file("test-file.txt", b"test content")
    url = await s3_storage.generate_expiring_url("test-file.txt")
    assert "test-file.txt" in url
    assert str(settings.STORAGE_URL) in url
