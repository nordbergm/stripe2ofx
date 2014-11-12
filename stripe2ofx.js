var csv = require('csv'),
    fs = require('fs'),
    moment = require('moment'),
    currency,
    startDate,
    endDate,
    transferDate,
    total = 0;

function init(data) {
  if (data.length < 2) {
    throw 'File does not contain any transactions.';
  }

  var i;

  console.log('Transactions:\t' + (data.length - 1));

  // limitation: we only support uniform currency files right now, make sure everything is the same currency
  currency = ensureFileIsUniformCurrency(data);
  console.log('Currency:\t\t' + currency);

  for (i = 1; i < data.length; i++) {
    total += (getAmount(data, i) - getFees(data, i));
  }

  console.log("Total:\t\t\t" + total.toFixed(2) + " " + currency.toUpperCase());

  for (i = 1; i < data.length; i++) {
    var row = data[i];
    var date = moment(getCell(data, row, 'Date'));

    if (!endDate || date > endDate) {
      endDate = date;
    }

    if (!startDate || date < startDate) {
      startDate = date;
    }
  }

  transferDate = moment(endDate).add('d', 7);

  console.log('Start Date:\t\t' + startDate.format('YYYY-MM-DD'));
  console.log('End Date:\t\t' + endDate.format('YYYY-MM-DD'));
  console.log('Transfer Date:\t' + transferDate.format('YYYY-MM-DD'));
}

// ensure that the currency of all transactions in this file is uniform.
// (Note: this program doesn't support multi-currency, yet)
// returns:  three-letter currency code that this file uses, or throws an exception if non-uniform
function ensureFileIsUniformCurrency(data) {
  var first_currency_code = getCell(data, data[1], 'Currency');

  for (var i = 2; i < data.length; i++) {
    var row_currency_code = getCell(data, data[i], 'Currency');
    if (row_currency_code != first_currency_code) {
      throw 'Error: This program does not yet support files with more than 1 type of currency';
    }
  }

  return first_currency_code;
}

// deal with Stripe inserting things like commas into the data
// this function removes any characters that aren't 0-9 . or - and converts to float
function getFloat(str) {
  return parseFloat(str.replace(/[^0-9\.\-]/g, ''));
}

function getAmount(data, i) {
  var amount = getFloat(getCell(data, data[i], 'Amount'));
  var refund = getCell(data, data[i], 'Type') == 'Refund';

  return refund ? amount * -1 : amount;
}

function getFees(data, i) {
  return getFloat(getCell(data, data[i], 'Fees'));
}

function getCell(data, row, column) {
  for (var i = 0; i < data[0].length; i++) {
    if (data[0][i].trim() == column) {
      return row[i];
    }
  }

  throw 'File does not have column ' + column;
}

function formatDate(date) {
  return date.format('YYYYMMDD');
}

function writeHeader(writer) {
  writer.push('OFXHEADER:100\n');
  writer.push('DATA:OFXSGML\n');
  writer.push('VERSION:102\n');
  writer.push('SECURITY:NONE\n');
  writer.push('ENCODING:USASCII\n');
  writer.push('CHARSET:1252\n');
  writer.push('COMPRESSION:NONE\n');
  writer.push('OLDFILEUID:NONE\n');
  writer.push('NEWFILEUID:NONE\n');

  writer.push('<OFX>\n');
  writer.push('\t<BANKMSGSRSV1>\n');
  writer.push('\t\t<STMTTRNRS>\n');
  writer.push('\t\t\t<TRNUID>0\n');
  writer.push('\t\t\t<STATUS>\n');
  writer.push('\t\t\t\t<CODE>0\n');
  writer.push('\t\t\t\t<SEVERITY>INFO\n');
  writer.push('\t\t\t</STATUS>\n');
  writer.push('\t\t\t<STMTRS>\n');
  writer.push('\t\t\t\t<CURDEF>' + currency.toUpperCase() + '\n');
  writer.push('\t\t\t\t\t<BANKACCTFROM>\n');
  writer.push('\t\t\t\t\t\t<BANKID>001\n');
  writer.push('\t\t\t\t\t\t<ACCTID>001\n');
  writer.push('\t\t\t\t\t\t<ACCTTYPE>CHECKING\n');
  writer.push('\t\t\t\t\t</BANKACCTFROM>\n');
  writer.push('\t\t\t\t\t<BANKTRANLIST>\n');
  writer.push('\t\t\t\t\t\t<DTSTART>' + formatDate(startDate) + '\n');
  writer.push('\t\t\t\t\t\t<DTEND>' + formatDate(endDate) + '\n')
}

function writeFooter(writer) {
  writer.push('\t\t\t\t\t\t<STMTTRN>\n');
  writer.push('\t\t\t\t\t\t\t<TRNTYPE>XFER\n');
  writer.push('\t\t\t\t\t\t\t<DTPOSTED>' + formatDate(transferDate) + '\n');
  writer.push('\t\t\t\t\t\t\t<TRNAMT>' + total.toFixed(2) * -1 + '\n');
  writer.push('\t\t\t\t\t\t\t<FITID>T' + transferDate + '\n');
  writer.push('\t\t\t\t\t\t\t<CHECKNUM>T' + transferDate + '\n');
  writer.push('\t\t\t\t\t\t\t<MEMO>Transfer to Bank Account\n');
  writer.push('\t\t\t\t\t\t</STMTTRN>\n');

  writer.push('\t\t\t\t\t</BANKTRANLIST>\n');
  writer.push('\t\t\t\t</STMTRS>\n');
  writer.push('\t\t</STMTTRNRS>\n');
  writer.push('\t</BANKMSGSRSV1>\n');
  writer.push('</OFX>\n');
}

function writeRow(writer, data, i) {
  var memo = getCell(data, data[i], 'Description');

  if (!memo || memo == '') {
    memo = getCell(data, data[i], 'ID');
  }

  var date = moment(getCell(data, data[i], 'Date'));
  var id = date.format('YYYYMMDDHHmm') + i;
  var amount = getAmount(data, i);
  var fees = getFees(data, i) * -1;
  var type = getCell(data, data[i], 'Type');
  var ofxChargeType = amount > 0 ? 'CREDIT' : 'DEBIT';
  var ofxFeeType = fees > 0 ? 'CREDIT' : 'DEBIT';

  writer.push('\t\t\t\t\t\t<STMTTRN>\n');
  writer.push('\t\t\t\t\t\t\t<TRNTYPE>' + ofxChargeType + '\n');
  writer.push('\t\t\t\t\t\t\t<DTPOSTED>' + formatDate(date) + '\n');
  writer.push('\t\t\t\t\t\t\t<TRNAMT>' + amount.toFixed(2) + '\n');
  writer.push('\t\t\t\t\t\t\t<FITID>C' + id + '\n');
  writer.push('\t\t\t\t\t\t\t<CHECKNUM>C' + id + '\n');
  writer.push('\t\t\t\t\t\t\t<MEMO>' + memo + '\n');
  writer.push('\t\t\t\t\t\t</STMTTRN>\n');

  writer.push('\t\t\t\t\t\t<STMTTRN>\n');
  writer.push('\t\t\t\t\t\t\t<TRNTYPE>' + ofxFeeType + '\n');
  writer.push('\t\t\t\t\t\t\t<DTPOSTED>' + formatDate(date) + '\n');
  writer.push('\t\t\t\t\t\t\t<TRNAMT>' + fees.toFixed(2) + '\n');
  writer.push('\t\t\t\t\t\t\t<FITID>F' + id + '\n');
  writer.push('\t\t\t\t\t\t\t<CHECKNUM>F' + id + '\n');
  writer.push('\t\t\t\t\t\t\t<MEMO>Stripe Fees ' + type + ' (' + memo + ')\n');
  writer.push('\t\t\t\t\t\t</STMTTRN>\n');
}

var fromPath = 'transfers.csv';
var toPath = 'transfers.ofx';

if (process.argv.length >= 3) {
  fromPath = process.argv[2];
}

if (process.argv.length >= 4) {
  toPath = process.argv[3];
}

fs.exists(fromPath, function(exists) {
  if (!exists) {
    console.error('Input ' + fromPath + ' not found!');
  } else {
    csv()
      .from.path(fromPath, { delimiter: ',', escape: '"', encoding: 'binary' })
      .to.array( function(data){
        var writer = [];

        init(data);
        writeHeader(writer);

        for (var i = 1; i < data.length; i++) {
          writeRow(writer, data, i);
        }

        writeFooter(writer);
        fs.writeFileSync(toPath, writer.join(''));
      });
  }
});
