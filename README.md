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