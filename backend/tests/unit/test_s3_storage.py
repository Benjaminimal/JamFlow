import pytest
from botocore.client import ClientError
from botocore.exceptions import BotoCoreError
from pytest_mock import MockerFixture

from jamflow.services.exceptions import StorageException
from jamflow.services.storage.s3 import S3StorageService


@pytest.fixture
def mock_s3_client(mocker: MockerFixture):
    # mock the S3 client used by the S3StorageService
    mock_client = mocker.AsyncMock()
    # make get_storage_client return the mock client
    mock_get = mocker.patch("jamflow.services.storage.s3.get_storage_client")
    mock_get.return_value = mock_client
    return mock_client


async def test_invlaid_credentials(mocker: MockerFixture):
    # raise an exception to simulate invalid credentials
    mock_session = mocker.patch("jamflow.services.storage.s3.get_session")
    mock_session.return_value.create_client.side_effect = BotoCoreError()

    with pytest.raises(StorageException):
        async with S3StorageService("test-bucket"):
            pass

    # verify that head_bucket and create_bucket were called
    mock_session.return_value.create_client.assert_called_once()


async def test_bucket_not_exists_auto_created(mock_s3_client):
    # raise an exception to simulate a non-existent bucket
    mock_s3_client.head_bucket.side_effect = ClientError({"Error": {"Code": "404"}}, "")

    async with S3StorageService("test-bucket"):
        pass

    # verify that head_bucket and create_bucket were called
    mock_s3_client.head_bucket.assert_called_once_with(Bucket="test-bucket")
    mock_s3_client.create_bucket.assert_called_once_with(Bucket="test-bucket")


async def test_bucket_exists_not_auto_created(mock_s3_client):
    # not raise an exception to simulate an existing bucket

    async with S3StorageService("test-bucket"):
        pass

    # verify that we checked for the existence of the bucket but did not create it
    mock_s3_client.head_bucket.assert_called_once_with(Bucket="test-bucket")
    mock_s3_client.create_bucket.assert_not_called()


async def test_store_file_success(mock_s3_client):
    # not raise an exception to simulate a successful file storage

    async with S3StorageService("test-bucket") as service:
        await service.store_file("test/path", b"test data")

    # verify that put_object was called with the correct parameters
    mock_s3_client.put_object.assert_called_once_with(
        Bucket="test-bucket", Key="test/path", Body=b"test data"
    )


async def test_store_file_error(mock_s3_client):
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


async def test_get_file_success(mocker: MockerFixture, mock_s3_client):
    # mock the return value of get_object
    mock_s3_client.get_object.return_value = {
        "Body": mocker.AsyncMock(
            read=mocker.AsyncMock(side_effect=[b"chunk1", b"chunk2", b""])
        )
    }

    async with S3StorageService("test-bucket") as service:
        file = await service.get_file("test/path")

    # verify that get_object was called with the correct parameters
    mock_s3_client.get_object.assert_called_once_with(
        Bucket="test-bucket", Key="test/path"
    )
    # verify that the file content is correct
    with file:
        assert file.read() == b"chunk1chunk2"


async def test_get_file_error(mocker: MockerFixture, mock_s3_client):
    # Mock S3 client to raise an exception
    mock_s3_client.get_object.side_effect = BotoCoreError()

    # Initialize S3Storage with mock client
    async with S3StorageService("test-bucket") as service:
        with pytest.raises(StorageException):
            await service.get_file("test/path")

    mock_s3_client.get_object.assert_called_once_with(
        Bucket="test-bucket", Key="test/path"
    )


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


async def test_generate_expiring_url_error(mock_s3_client):
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


async def test_purge_bucket_success(mock_s3_client):
    # simulate files in the bucket
    mock_s3_client.list_objects_v2.return_value = {
        "Contents": [{"Key": "file1.txt"}, {"Key": "file2.txt"}]
    }

    async with S3StorageService("test-bucket") as service:
        await service.purge()

    # verify that list_objects_v2 and delete_objects were called
    mock_s3_client.list_objects_v2.assert_called_once_with(Bucket="test-bucket")
    mock_s3_client.delete_objects.assert_called_once_with(
        Bucket="test-bucket",
        Delete={"Objects": [{"Key": "file1.txt"}, {"Key": "file2.txt"}]},
    )


async def test_purge_bucket_empty(mock_s3_client):
    # simulate an empty bucket
    mock_s3_client.list_objects_v2.return_value = {}

    async with S3StorageService("test-bucket") as service:
        await service.purge()

    # verify that list_objects_v2 was called but delete_objects was not
    mock_s3_client.list_objects_v2.assert_called_once_with(Bucket="test-bucket")
    mock_s3_client.delete_objects.assert_not_called()
