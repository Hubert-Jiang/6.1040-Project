# Tasks for User Study
| Title | Instruction | Rationale |
| :---  | :----:   | ---:     |
| Login | Open the website and follow the instructions to access the marketplace. See what options are available, e.g. if you need to register an account. | There should be minimal friction, and it should be obvious that the user just has the click the "Login with Touchstone" button. The user should already have an active Touchstone session - unless it expired - so it should be a short temporary redirect. All in all, it should be a one-click process. |
| View and Update Profile | The application automatically populates your profile with information provided by MIT. This includes your legal name and kerb/MIT email. Check this information, and verify it is to your liking, or modify it if you have alternative preferences. Additionally, see if you understand how this information may be shared with others. | People may have an alternative preference to their legal name, or would prefer to be contacted through phone or such instead of email. It's important that it's easy to modify these preferences, and that it's clear how it is shared when a listing resolves. Hopefully everything is self-explanatory, or has already-present documentation as to how it functions. Additional restructuring or documentation may be needed if this is not the case. |
| Browse Marketplace | Browse through the marketplace and try to look for specific items. Feel free to look at any particularly interesting listings. | See if the mechanics of clicking on a listing to expand it into the sidebar is intuitive. The thumbnails show the current bid, but hopefully it is clear how to see the options to actually bid, the image carousel, etc. |
| Place Bid | Pick an interesting listing and place a bid. Don't worry about actual money for now. | Hopefully the interactions between the current bid price, the minimum increment, and the buyout price are clear. If they aren't,   additional restructuring or documentation may be needed. |
| Make Listing | Find a nearby object, or look one up, and create a listing for it. | Hopefully the create interface is intuitive, and how users can select which image is the cover image. Similarly, the interactions between the current bid price, the minimum increment, and the buyout price should be clear. How the pseudonyms work should also be clear. The user should have minimal verbal questions about these options. |
| Cancel Listing | Suppose the listing you just made was actually an accidently. Delete it. | The user should be able to figure out how to find the delete listing button on the sidebar. If not, additional restructuring or documentation may be needed. |


# User Study
For this user study, we had two participants. The first participant seemed to have a much smoother experience than the second, largely due to some unforseen interactions. The first participant happily completed each task, but actually logged in before being asked to. They also exclaimed how they liked the overall login interactions, specifically that it interacted all the 2FA steps they were used to, such as Duo verification. This overall created a sense of security and familiarity. However, when prompted to, the participant took a while to find the tip about how the pseudonyms worked. Even when they found the tip, they had to go close to their screen and squint to read it. In hindsight, perhaps a quick tutorial on how pseudonyms work could be beneficial. The first participant did verbally ask if there was a limit on how much they could start a listing at. However, they quickly answered their own question when they tried to enter a large number as the starting price, to which the application showed a warning giving the bounds of valid input. The rest of the first participants interaction was uneventful. The second participant similarly had no issues logging in or viewing listings. However, we ran into issues when the participant tried to upload `.heic` files as images for the listing. The application clearly states that only `.png`, `.jpg`, or `.webp` images are allowed, but the frontend only checks the file extension. That is, if a user tried to upload a `.txt` file, there would be clear user feedback that such an operation is not allowed. However, the participant had stored the `.heic` file as a `.heic.jpg`, implying that they had previously renamed the file to get around a simillar issue, though perhaps with another application. Operating systems typically have no issue with this as they only use the file extension as a hint, but really look at the content header within the file, which dictates the actual file format. Similarly, the application backend verifies these image headers and doesn't blindly trust the file extension. However, this desync in what is allowed/not allowed to be uploaded simply meant the server responded with a vague `400 Bad Request` error with no feedback as to why they couldn't create the listing. The frontend should've prevented the participant from attaching the file in the first place, and when unexpected backend errors do occur, they just should be informative. Besides this, the participant said that the application was super intuitive and understood how to use it, though they were still left a little confused as to how the pseudonyms worked.

## Opportunities for Improvement
### Pseudonyms
- Users ignore the tips that explain how they work
- Users are left unaware as to what they even do
- However, users will still be able to use the application regardless of understanding how the pseudonyms work
- Physical flaw; such information is present but not super clear or accessible
- Moderate flaw; it is pretty important to how the application is designed and also the identity of why the concepts are the way they are

### Uninformative errors
- Many interactions are missing feedback, especially on unexpected errors
- Server errors are uninformative
- Physical flaw; the errors are completely missing
- Major flaw; users are left bewildered as to why the interaction is failing
- Issue worsens if only one attachment is illegal, but the rest are fine; the user wouldn't know why unless they looked closer

### Sorting by listings not owned
- The users never mentioned this, but while pre-populating the listings, I noticed that there was no option to filter by listings owned by others
- There is only a filter option for listings owned by the user
- Physical flaw; a lot of clutter if the user owns a lot of listings
- Minor flaw; just QOL
