
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'


import { JwtToken } from '../../auth/JwtToken'
import { verify } from 'jsonwebtoken'


const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJMtdbZEL3/1AkMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi0zLS00bXlwdS51cy5hdXRoMC5jb20wHhcNMjAxMTI3MDMyMzQ3WhcN
MzQwODA2MDMyMzQ3WjAkMSIwIAYDVQQDExlkZXYtMy0tNG15cHUudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt8iWNfBbfH36EdrP
t69nLP8LLYW2kZvb+xlb8vk6T6D5b9O5/C8VMdJRZXk05+AAjzNP4cF6l13dpnqS
o5tByT8oh9qvNl9KKwkh1y5g7NfrTSv8rG6nc8Brc9H4kQ6QYnyNoSA6TCqSdzwZ
i8hIzrBqoS93xNF22al8sjtEKnhNy+WPS51AUA1tr0CXI93dtITYn+4liXhF2F7s
Q4liJeZh1lNSAfiCMd9LjD3qDXu18CEqoFgzJNp1rirBJFIOltReaZXnjbLNyn0C
O985JMyLl/AZ1/NCjRExhAVEEDRD2Jer7BSC1jKzNWp8UNk1LSD+vH9O4bZIuMXr
ghYfOQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTGa7l/ubXJ
ZE70mnaYxvGaTtSXsjAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AG2azUGJlvoF45iAto463j10BHskhxPPCOf2hykGfjjfHoFbu+14P1qSKgelc/JH
az9+lySCMq524Pf+eRBsNFDxv/1f97RK5aCxsJiFVjH3nqnRHiLEoA2XbqzIsSD7
fFNMS77BH+eH8YXFI+atcLn5d61rzvvjevNTFeECU1FjyDXI29fLOzNAUma3hg+t
Jd37EQmdmwkdK/AQLr5qQrpzAqKLnFDJPqW1L8cA59Ei0ZHgIoUGwq+k2bcCtRBl
gTKPNArZNA6VGtGHo79/8v/r6Szpb6LBKM2x05FVUOmFvr0CmsISv3ovlGw4FE+1
AhSICm5z9dgLq//Yhz4Yz4I=
-----END CERTIFICATE-----`


export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    try {
        const decodedToken: JwtToken = verifyToken(event.authorizationToken);
        console.log("User was authorized");

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
    catch (e) {
        console.log("User was not authorized", e.message)

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

    return verify(
        token, // JWT Token from an HTTP header to validate
        cert, // A certificate copied from Auth0 website
        { algorithms: ['RS256'] } // We need to specify that we use the RS256 algorithm
    ) as JwtToken;

    // A request has been authorized
}
