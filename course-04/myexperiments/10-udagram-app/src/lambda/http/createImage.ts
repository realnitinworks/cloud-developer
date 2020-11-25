import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'


const docClient = new AWS.DynamoDB.DocumentClient()

const s3 = new AWS.S3({
    signatureVersion: 'v4'
});

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
// const urlExpiration = process.env.SIGNED_URL_EXPIRATION


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const groupId = event.pathParameters.groupId;
    const validGroup = await groupExists(groupId);
    console.log(`validGroup = ${validGroup}`);

    if (!validGroup) {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: "Group does not exist"
            })
        }
    }

    // Create an entry in Dynamo DB table
    const imageId = uuid.v4();
    const timestamp = (new Date()).toJSON();  // toISOString() instead
    const parsedBody = JSON.parse(event.body);
    const newImage = {
        groupId: groupId,
        imageId: imageId,
        timestamp: timestamp,
        ...parsedBody,
        imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}` // User can use this URL to see the image
    }

    await docClient.put({
        TableName: imagesTable,
        Item: newImage
    }).promise()

    // Get a signed url for putting an image into S3
    const url = getUploadUrl(imageId);
    
    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            newItem: newImage,
            uploadUrl: url  // User can use this url to put an image into S3
        })
    }
}

async function groupExists(groupId: string) {
    const result = await docClient.get({
        TableName: groupsTable,
        Key: {
            id: groupId
        }
    }).promise()

    console.log('Get Group: ', result);
    return !!result.Item
}


function getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: 300
    })
}
