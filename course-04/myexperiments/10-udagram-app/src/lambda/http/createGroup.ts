import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import { getUserId } from '../../auth/utils'

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)
    const itemId = uuid.v4()

    const parsedBody = JSON.parse(event.body)
    const jwtToken = getToken(event); // encoded JWT Token in header
    const userId = getUserId(jwtToken); // .sub from decoded JWT Token

    const newItem = {
        id: itemId,
        userId,
        ...parsedBody
    }

    await docClient.put({
        TableName: groupsTable,
        Item: newItem
    }).promise()

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            newItem
        })
    }
}


function getToken(event: APIGatewayProxyEvent) {
    const authorization = event.headers.Authorization;
    const jwtToken = authorization.split(' ')[1];
    return jwtToken;
}