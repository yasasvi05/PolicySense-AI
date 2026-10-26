# Digital Payments and Transaction Disputes Policy

**Policy ID:** NCB-PAY-003  
**Version:** 1.0 | **Effective date:** 1 October 2026  
**Institution:** Northstar Community Bank (fictional)

## 1. Purpose and scope
This policy covers digital transfers, online payments, duplicate debits, pending transactions, failed payments, and disputes where the customer does not recognize a transaction. It should be read together with the UPI Payments Policy for UPI-specific cases.

## 2. Common transaction statuses
- **Successful:** The bank's available status indicates completion. If the recipient says funds were not received, a trace may still be required.
- **Pending:** The transaction has not reached a final status. The bank must check the payment rail and transaction reference before advising on the outcome.
- **Failed:** The available status indicates that the payment did not complete.
- **Reversed:** The original debit has been returned or offset by a corresponding credit.
- **Disputed:** The customer has asked the bank to investigate a transaction or its handling.

A displayed status may lag behind the underlying payment system. The chatbot should not treat a screenshot or a customer's description alone as proof of the final settlement status.

## 3. Failed payment with debit
If a payment fails but the account is debited, possible explanations include an interrupted processing flow, a receiving institution that did not complete the payment, or a delayed status update. These are possible scenarios, not confirmed causes. Support must verify the transaction reference, timestamp, amount, and current status.

Under this fictional demonstration policy, if the payment is confirmed failed, the expected reversal target is within 5 business days from the transaction date. This target is invented for this dataset and is not a statement of an actual regulatory deadline. If the amount remains unreversed after the applicable target, the customer should register a dispute and receive a case reference.

## 4. Duplicate debit
If the customer reports two debits for one intended payment, support should compare transaction references, timestamps, and merchant or recipient details. Two entries may represent two separate payment attempts, a pending entry and a final entry, or a genuine duplicate. Do not promise a refund until the bank confirms that a duplicate debit occurred.

## 5. Unrecognized transaction
If a customer does not recognize a debit, advise them to use the bank's official secure channel to report it promptly and request the relevant payment instrument or digital channel be secured. Do not ask for a password, PIN, OTP, or full card security code. The security review must determine whether the transaction was authorized.

## 6. Evidence and dispute submission
A dispute may require the transaction reference, date and time, amount, recipient or merchant name, and a short description. Sensitive credentials must never be included. If the customer cannot find the reference, support should explain how to locate it in the official transaction history.

## 7. Escalation
If the transaction is not resolved through the standard workflow, the case should be routed to the payments-dispute team. The customer should receive a case number and an update channel. Use the Customer Complaints and Escalation Policy for subsequent escalation.
