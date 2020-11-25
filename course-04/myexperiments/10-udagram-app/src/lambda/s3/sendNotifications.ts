import { S3Handler, S3Event } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'


const docClient = new AWS.DynamoDB.DocumentClient()

const connectionsTable = process.env.CONNECTIONS_TABLE
const stage = process.env.STAGE
const region = process.env.REGION
const apiId = process.env.API_ID


const connectionParams = {
    apiVersion: "2018-11-29",
    endpoint: `${apiId}.execute-api.${region}.amazonaws.com/${stage}`
}

// To send notifications using API Gateway
const apiGateway = new AWS.ApiGatewayManagementApi(connectionParams);


export const handler: S3Handler = async (event: S3Event) => {
    for (const record of event.Records) {
        const key = record.s3.object.key;
        console.log(`Processing S3 item with key: ${key}`)
    
        const connections = await docClient.scan({
            TableName: connectionsTable
        }).promise();

        const payload = {
            imageId: key
        }

        for (const connection of connections.Items) {
            const connectinId = connection.id;
            await sendMessageToClient(connectinId, payload);
        }
    }
}

async function sendMessageToClient(connectionId, payload) {
    try {
        console.log('Sending message to a connection', connectionId);
        await apiGateway.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(payload)
        }).promise();
    }
    catch (e) {
        console.log('Failed to send message', JSON.stringify(e));
        // We have connection that was closed but a stale connectionId is still in Dynamo DB
        if (e.statuCode === 410) {
            console.log("Stale Connection");

            // Remove the stale connectinId from Dynamo DB
            await docClient.delete({
                TableName: connectionsTable,
                Key: {
                    id: connectionId
                }
            }).promise();
        }
    }
}
