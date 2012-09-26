### Changed in 0.8.2 :
- Fixed a number of security issues reported by both Gynvael Coldwind (http://gynvael.coldwind.pl/) and Krzysztof Kotowicz (http://blog.kotowicz.net/)
- Added multi language support , thanks to the patch from (@Crepuscule https://github.com/RC1140/cr-gpg/issues/20)
- Fixed an issue when adding multiple recipients , thanks to the patch from (@luisgmuniz https://github.com/RC1140/cr-gpg/issues/23)
- Added dynamic key selection for decryption based on the currently logged in email address.
- Complete change of backend from using command line calls to using libgpgme.
- Numerous other changes which I cant remember.

### Change updated in 0.7.4 :
- Restriced the sites that the extension is enabled for to only mail.google.com/*     
- Added the chrome auto update information to the manifest so that new changes are deployed easily    

