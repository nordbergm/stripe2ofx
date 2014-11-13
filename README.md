# Stripe 2 OFX #

A small command line utility that converts the [Stripe](http://stripe.com) transfer exports  (CSV) to the [OFX](http://en.wikipedia.org/wiki/Open_Financial_Exchange) file format often used by accounting software for bank statement imports.

## What exactly does it do? ##
For each charge transaction:

- It creates a credit transaction for the charged amount
- It creates a debit transaction for the fees

For each refund transaction:

- It creates a debit transaction for the refunded amount
- It creates a credit transaction for the refunded fees

At the end it creates a transfer of the whole net value to your bank account.

## What's this good for? ##
It lets you treat your Stripe account as if it was a real bank account in your accounting software and reconcile the individual transactions against invoices, credit notes, and bank fees.

When the money gets deposited into your bank account as a lump sum you can explain the transaction as a transfer from your "Stripe account".

## How to run ##
clone this repository somewhere:
```
git clone https://github.com/INSERTURLHERE/stripe2ofx
cd stripe2ofx
```

make sure you have nodejs and npm installed.  On Ubuntu 14.04, you can do this:
```
sudo apt-get install nodejs npm
```

install dependencies
```
npm install
```

Download data from Stripe.  Go into your dashboard, click 'Transfers' on the left navbar.  
Click 'View All Transfers', then 'export' in the upper right.

Place your transfers.csv file in the stripe2ofx directory and run:
```
nodejs stripe2ofx.js
```

When the app is done, it will spit out a .OFX which you can import into Quickbooks or any compatible accounting software,
(such as Stripe)

## Known Limitations ##
Currently, this app only supports files where all transactions are the same currency.  

If a file has multiple currencies, such as Euros and Dollars mixed together, it will throw an error.

If multiple currency is important to you, please open an issue in the issue tracker, we may be able to fix it easily.
