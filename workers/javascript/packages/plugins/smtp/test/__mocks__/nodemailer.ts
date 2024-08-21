import * as nodemailer from 'nodemailer';
import * as nodemailerMock from 'nodemailer-mock';
module.exports = nodemailerMock.getMockFor(nodemailer);
