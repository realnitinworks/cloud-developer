import { CustomAuthorizerEvent, CustomAuthorizerResult, CustomAuthorizerHandler} from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

const auth0Secret = process.env.AUTH_0_SECRET;


export const handler: CustomAuthorizerHandler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    try {
        const decodedToken: JwtToken = verifyToken(event.authorizationToken);
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
}


function verifyToken(authHeader: string): JwtToken {
    if (!authHeader) {
        throw new Error('No authorization header');
    }

    if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
        throw new Error('Invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    return verify(token, auth0Secret) as JwtToken;

    // A request has been authorized
}