# Notes for the reviewer

Hi, thanks for taking the time to look at my work.

I want to say first that time was short. There are many things in this project that can be improved more, in the UI, in auth and in many other places. There is always room to make things better. In this note I'm sharing what I have done and the things I saw that can be done next.

To run it, see the [README](README.md). It's just `npm run setup` and then `npm run dev`.

---

## What I have done

### For players

- Search venues and filter them by sport and city
- Pick a date (up to 60 days ahead) and see which slots are free, booked or past
- Book a slot with name, email and phone. After booking you get a reference like `PS-12AB34CD`
- The slots you booked show as **"Your booking"** on the venue page. Clicking one opens that booking again
- If you refresh the page after booking, the booking and the date you picked stay on the page
- **My bookings**: you enter your email, get a 6-digit code, and then you can see and cancel your bookings
- You can also open a booking directly with its reference (`/confirmation?ref=PS-...`) and cancel it from there

### For admin

- Login with email and password (the session is an `httpOnly` cookie, nothing is saved in browser storage)
- Add, edit, hide or delete venues
- Add weekly slots or one-off slots for a particular date
- See all bookings with search, filters and pages, and cancel a booking

### Behind the scenes

- **No double booking.** The database itself stops two bookings for the same time, even if two people click at the same second. There is a test where 15 requests hit the same slot together and only 1 succeeds
- Input checks on every API route, rate limits, security headers, request logs and health checks
- API docs at `/api/docs`
- Tests for the API (39) and the website (13)
- One-command setup, so anyone can run the project easily

---

## Problems I found while testing and fixed

These came up when I was using the app myself:

1. **The booking looked lost after a refresh.** The booking was saved in the database, but the page only kept it in temporary memory. After a refresh it went away, and the date also went back to today. I fixed it by keeping the date and booking reference in the URL, and the page loads the booking again after a refresh.
2. **Anyone could see anyone's bookings.** Earlier, if you typed any email on "My bookings", you could see that person's bookings with their name and phone number, and even cancel them. Now you need a code sent to that email, or the booking reference.
3. **Wrong code tries were not being counted.** While adding the email code, a test showed the wrong-try counter was getting undone (the database transaction was rolling it back). That meant someone could keep guessing codes forever. I fixed it, and now a code stops working after 5 wrong tries.
4. **Setup was hard for a new person.** It needed two terminals and many manual steps. I added `npm run setup` and `npm run dev`, which handle everything and show a clear message if something is missing.

---

## What can be improved more

### UI / UX

- Show "Your booking" on any device, not only in the browser where you booked (this needs user accounts)
- A calendar view, so you can see free slots for the whole week together
- More filters: price range, distance, rating, indoor or outdoor
- Venue photo gallery, map location and reviews
- Better loading animations and empty screens in some places
- Dark mode, and a proper accessibility check with a screen reader
- Updating the screenshots, because some of them show the old screens

### Auth and security

- Proper player accounts (login with email or Google), so people don't need a code every time
- Admin roles, like a super admin and a venue manager who only sees their own venue
- Admin password reset and two-factor login
- A log of what each admin changed and when
- The booking reference is only 8 characters. It can be made longer to make it harder to guess

### Booking features

- Online payment (like Razorpay or Stripe) and refunds when someone cancels
- Confirmation and reminder emails or SMS, a day before the booking
- Booking more than one slot together, and booking for a group
- A cancellation policy, for example no cancelling within 2 hours of the slot
- Different prices for peak hours and weekends

### Technical

- **Timezone:** the website takes "today" from the user's device, but the server uses India time. Someone in another country, or booking around midnight, can see the wrong day. The website should take "today" from the server
- A browser test (Playwright) for the full flow: book, refresh, see "Your booking", cancel
- Deploying it live with real emails, so it can be tried without setting anything up
- Caching for the venue list, and moving the rate limits to Redis when there is more than one server
- Monitoring and error alerts (like Sentry)

---

## How I used AI

As you asked, I used AI (Claude Code) to build this. It helped me write the code, find bugs and write the tests. I did the testing of the app myself. I found the refresh problem while using the app, decided what needed to be fixed and in what order, and checked every change with the tests and by running the app.

---

Thank you again. I'm happy to walk through any part of the code, or explain why I made a choice.
