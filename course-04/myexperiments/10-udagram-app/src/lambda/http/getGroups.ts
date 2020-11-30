import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'


import * as express from 'express'
import * as awsServerlessExpress from 'aws-serverless-express'

import { getAllGroups } from "../../businessLogic/groups"


const app = express();
// Create Express server
const server = awsServerlessExpress.createServer(app)


app.get('/groups', async (_req, res) => {
    // TODO: get all groups as before
    const groups = await getAllGroups();

    // Return a list of groups
    res.json({
        items: groups
    });
})

// Pass API Gateway events to the Express server
exports.handler = (event, context) => { 
    awsServerlessExpress.proxy(server, event, context)
}