import { S3Event, S3EventRecord, SNSHandler, SNSEvent } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import Jimp from 'jimp/es'


const s3 = new AWS.S3({
    signatureVersion: 'v4'
});

const imagesBucket = process.env.IMAGES_S3_BUCKET;
const resizedImagesBucket = process.env.RESIZED_IMAGES_S3_BUCKET;


export const handler: SNSHandler = async (event: SNSEvent) => {
    console.log('Processing SNS Event ', JSON.stringify(event));
    for (const snsRecord of event.Records) {
        const s3EventStr = snsRecord.Sns.Message;
        console.log('Processing S3 event', s3EventStr);
        const s3Event = JSON.parse(s3EventStr);

        await processS3Event(s3Event);
    }
}

const processS3Event = async (event: S3Event) => {
    for (const record of event.Records) {
        await processImage(record);
    }
}

const processImage = async (record: S3EventRecord) => {
    // To download an object, we need to get its key
    const key = record.s3.object.key;

    // Download the image using the key
    const response = await s3.getObject({
        Bucket: imagesBucket,
        Key: key
    }).promise();

    const body: Buffer = response.Body;

    // Read an image with the Jimp library
    const image = await Jimp.read(body);

    // Resize an image maintaining the aspect ratio
    image.resize(150, Jimp.AUTO);

    // Convert an image to a buffer that we can write to a different bucket
    const resizedBuffer: Buffer = await image.getBufferAsync(Jimp.AUTO);

    // Write the resized image to new bucket
    await s3.putObject({
        Bucket: resizedImagesBucket,
        Key: `${key}.jpeg`,
        Body: resizedBuffer
    }).promise();
}