import { GameLiftClient } from "@aws-sdk/client-gamelift";

const gamelift = new GameLiftClient({ region: process.env.AWS_REGION });

export default gamelift;
