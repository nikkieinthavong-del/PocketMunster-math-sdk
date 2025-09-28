### Uploading to S3

**Note:**
This is a temporary/alternate method of uploading math-engine outputs to S3 for storage/testing. Eventually games will be uploaded directly to the RGS via an ACP.
In the meantime the `upload_to_aws()` function to be used in conjunction with the users AWS access and secret keys, imported from a `.env` file.

This function will compare file details stored locally with those provided in the games respective `config.json` file. The lookup table RTP is verified (unless specifically overridden) before uploading via the `AWS boto3` client.
