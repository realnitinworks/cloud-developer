import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'


import { CreateGroupRequest } from '../../requests/CreateGroupRequest'
import { createGroup } from '../../businessLogic/groups'


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const newGroup: CreateGroupRequest = JSON.parse(event.body)
    const jwtToken: string = getToken(event); // encoded JWT Token in header
    
    const newItem = await createGroup(newGroup, jwtToken);

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