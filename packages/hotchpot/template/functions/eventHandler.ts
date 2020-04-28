import * as AWS from "aws-sdk";

exports.handler = (event, context, callback) => {
  event.Records.forEach((record) => {
    console.log("Stream record: ", JSON.stringify(record, null, 2));
  });
  callback(null, `Successfully processed ${event.Records.length} records.`);
};
