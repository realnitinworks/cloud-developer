import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE


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

    const imageId = uuid.v4();
    const timestamp = (new Date()).toJSON();  // toISOString() instead
    const parsedBody = JSON.parse(event.body);
    const newImage = {
        groupId: groupId,
        imageId: imageId,
        timestamp: timestamp,
        ...parsedBody
    }

    await docClient.put({
        TableName: imagesTable,
        Item: newImage
    }).promise()
    
    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            newItem: newImage
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
