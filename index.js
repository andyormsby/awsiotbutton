/*
 * This needs the following environment variables set in the Lambda configuration.
 * SFUSER
 * SFPASSWD
 * Username and password of the user account being accessed to insert the events.
 * 
 * SFTOKEN
 * You will need to set this as AWS Lambda will be accessing Salesforce from a non-Salesforce IP address.
 * Get one by going to <user> -> My Settings -> Personal Information -> Reset My Security Token 
 * for the relevant user. 
 * 
 * CLIENTID
 * CLIENTSECRET
 * The values for ClientID and Client Secret from the configuration of the Connected App you define to allow 
 * access to the org. NB You also need to enble access to the Profile associated with the relevant user.
 *
 * ENVIRONMENT
 * production or sandbox 
 * 
 * SOBJECT
 * The name of the SObject you want to populate with AWS IoT button click information. The name of the object 
 * doesn't matter but the code here assumes that it has three custom fields:
 * Serial__c (a text field, at least 16 characters - this is the AWS IoT button ID)
 * Click_Type__c -- picklist with values SINGLE, DOUBLE, LONG
 * Battery_Voltage__c  -- a text field, at least 6 characters (example value - 1752mV)
 *
 * Andy Ormsby, Salesforce. 
 */

'use strict';

const AWS = require('aws-sdk');
const nforce = require('nforce');

var sfuser = process.env.SFUSER;
var sfpasswd = process.env.SFPASSWD;
var sftoken = process.env.SFTOKEN;
var clientid = process.env.CLIENTID;
var clientsecret = process.env.CLIENTSECRET;
var environment = process.env.ENVIRONMENT;
var sobject = process.env.SOBJECT;
var oauth;

var org = nforce.createConnection({
	clientId: clientid,
	clientSecret: clientsecret,
	redirectUri: 'http://localhost:3000/oauth/_callback',
	environment: environment,
	mode: 'single'
});

let logit = (eventToInsert) => {
		var click = nforce.createSObject(sobject, {
			Serial__c: `${eventToInsert.serialNumber}`,
			Click_Type__c: `${eventToInsert.clickType}`,
			Battery_Voltage__c: `${eventToInsert.batteryVoltage}`
	});
    org.authenticate({username: sfuser, password: sfpasswd + sftoken }, err => {
        if (err) {
            console.error("Authentication error");
            console.error(err);
        } else {            
        	oauth = org.oauth.access_token;
            console.log('Authentication successful. Access token = '+ oauth);
            org.insert({ sobject: click }, function(err, resp){
				if(!err) { 
					console.log('Success.'); 
				} else {
					console.log('Error inserting click record: ' + err.message);
				}
			});
		}
	});    
};

exports.handler = (event, context, callback) => {
    console.log('Received event:' + JSON.stringify(event));

    logit(event);
};
