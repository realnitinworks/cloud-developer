import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'


import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

import * as middy from 'middy'
import { secretsManager } from 'middy/middlewares'

const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;


export const handler = middy (async (event: CustomAuthorizerEvent, context): Promise<CustomAuthorizerResult> => {
    try {
        const decodedToken: JwtToken = verifyToken(
            event.authorizationToken,
            context.AUTH0_SECRET[secretField]
        );
        console.log('User was authorized');

        return {
            principalId: decodedToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'  // Allow access to all Lambda functions
                    }
                ]
            }
        }
    }
    catch(e) {
        console.log("User was not authorized", e.message);
        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*' // Deny access to all Lambda functions
                    }
                ]
            }
        }
    }
});


function verifyToken(authHeader: string, secret: string): JwtToken {
    if (!authHeader) {
        throw new Error('No authorization header');
    }

    if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
        throw new Error('Invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    return verify(token, secret) as JwtToken;

    // A request has been authorized
}

handler.use(
    secretsManager({
        cache: true,
        cacheExpiryInMillis: 60000,
        throwOnFailedCall: true, // If it fails to fetch the secret, the invocation of handler should fail
        secrets: {
            AUTH0_SECRET: secretId
        }
    })
)