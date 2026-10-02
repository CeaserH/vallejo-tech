# Customer appointment management

`manageAppointment` is a callable function in `us-west2`. The site sends a reference and a private 256-bit token to view an appointment or explicitly cancel it. The function validates the stored SHA-256 token hash; a reference alone grants no access. Responses omit internal fields and credentials.

Cancellation atomically moves the record from `appointments` to `completed_appointments` with status `cancelled` and queues notifications to the customer, support@vallejotech.org, and ceaser.r.hernandez@gmail.com. Repeated cancellation returns the existing cancelled state without adding mail. The existing Trigger Email extension delivers these notifications.

New requests store a management link and token hash. Existing appointments without these fields cannot use this feature, and previously sent emails are not changed. Rescheduling preserves the link; completed appointments remain viewable but cannot be cancelled.

Links use the website origin at booking time. Localhost bookings produce localhost links for local testing. Production bookings produce public links. The token is in the URL fragment, not the query string.

Validation:

```sh
npm test --prefix functions
node --test tests/*.test.mjs
npm run build
```

Deploy only this codebase (does not deploy or migrate Trigger Email):

```sh
firebase deploy --only functions:appointment-management --project vallejotech
```

Manual acceptance check: create a test appointment, open the customer email link in a separate browser, verify the details, cancel explicitly, and check the admin archive plus the three cancellation email delivery states. Open the same link again and confirm no additional cancellation messages appear.
