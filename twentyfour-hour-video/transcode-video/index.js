'use strict';
const AWS = require('aws-sdk');
const mediaConvert = new AWS.MediaConvert({
    endpoint: process.env.MEDIA_ENDPOINT
});

// The name of the S3 bucket where transcoded (processed) videos will be saved
const transcodedVideoBucketName = process.env.TRANSCODED_VIDEO_BUCKET;

exports.handler = async (event, context) => {
    // Extract the object (file) path from the incoming S3 event
    const uploadedFilePath = event.Records[0].s3.object.key;

    // Decode any special characters in the file path (like '+' for spaces)
    const decodedFilePath = decodeURIComponent(uploadedFilePath.replace(/\+/g, ' '));

    // Remove the file extension to create a base name for the output
    const baseFileName = decodedFilePath.split('.')[0];

    // Construct the full S3 URI for the uploaded file (input path for processing)
    const inputFileS3Uri = 's3://' + event.Records[0].s3.bucket.name + '/' + uploadedFilePath;

    // Construct the full S3 URI for the output location (where the processed file will go)
    const outputFolderS3Uri = 's3://' + transcodedVideoBucketName + '/' + baseFileName + '/';

    try {
        const job = {
            Role: process.env.MEDIA_ROLE,
            Settings: {
                Inputs: [{
                    FileInput: inputFileS3Uri,
                    AudioSelectors: {
                        "Audio Selector 1": {
                            SelectorType: "TRACK",
                            Tracks: [1]
                        }
                    }
                }],
                OutputGroups: [{
                    Name: "File Group",
                    Outputs: [{
                        Preset: "System-Generic_Hd_Mp4_Avc_Aac_16x9_1920x1080p_24Hz_6Mbps",
                        Extension: "mp4",
                        NameModifier: "_16x9_1920x1080p_24Hz_6Mbps"
                    }, {
                        Preset: "System-Generic_Hd_Mp4_Avc_Aac_16x9_1280x720p_24Hz_4.5Mbps",
                        Extension: "mp4",
                        NameModifier: "_16x9_1280x720p_24Hz_4.5Mbps"
                    }, {
                        Preset: "System-Generic_Sd_Mp4_Avc_Aac_4x3_640x480p_24Hz_1.5Mbps",
                        Extension: "mp4",
                        NameModifier: "_4x3_640x480p_24Hz_1.5Mbps"
                    }],
                    OutputGroupSettings: {
                        Type: "FILE_GROUP_SETTINGS",
                        FileGroupSettings: {
                            Destination: outputFolderS3Uri
                        }
                    }
                }]
            }
        };

        const mediaConvertResult = await mediaConvert.createJob(job).promise();
        console.log(mediaConvertResult);

    } catch (error) {
        console.error(error);
    }
};
;;
