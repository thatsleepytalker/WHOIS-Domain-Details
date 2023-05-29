const whois = require('whois');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');

domainNames = ['sharemarketstudies.com','google.com'] // Write all the domain names you want to search for here...

const csvWriter = createCsvWriter({
  path: 'whois_records.csv',
  header: [
    { id: 'name', title: 'Name' },
    { id: 'domain', title: 'Domain Name' },
    { id: 'email', title: 'Email ID' },
    { id: 'phone', title: 'Phone Number' },
  ],
});

const whoisRecords = [];

const extractWhois = (domain) => {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const name = data.match(/Registrant Name: (.*)/i)?.[1] || '';
        const email = data.match(/Registrant Email: (.*)/i)?.[1] || '';
        const phone = data.match(/Registrant Phone: (.*)/i)?.[1] || '';

        whoisRecords.push({ name, domain, email, phone });

        resolve();
      }
    });
  });
};

async function sendEmail() {

    let testAccount = await nodemailer.createTestAccount();
    const emailConfig = {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user, 
        pass: testAccount.pass, 
      }
    };
  
    const transporter = nodemailer.createTransport(emailConfig);
  
    const mailOptions = {
      from: emailConfig.auth.user,
      to: 'gauravrathore701@gmail.com',
      subject: 'Newly Registered Domain Details',
      html: `<h2>Domain name details are in attachment</h2>`,
      attachments: [{
        filename: 'whois_records.csv',
        path: 'whois_records.csv'
      }]
    };
  
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
          const errorMessage = `Error sending email: ${err.message}`;
          logError(errorMessage);
          console.error(errorMessage);
      } else {
        console.log('Email sent successfully:', info.response);
      }
    });
  }

schedule.scheduleJob('47 16 * * *', function(){
    Promise.all(domainNames.map(extractWhois))
    .then(() => {
    csvWriter
      .writeRecords(whoisRecords)
      .then(() => {
        sendEmail();
      })
      .catch((error) => console.error('Error writing CSV:', error));
  })
  .catch((error) => console.error('Error extracting WHOIS records:', error));
});