## Cr-GPG: 

A chrome plugin that enables gpg encryption and decryption for the gmail web interface.
Download it from [here](http://thinkst.com/tools/cr-gpg/)

A brief tutorial can be found [at](http://blog.thinkst.com/2011/09/chrome-extension-for-gpg-in-gmail.html)

## Known Issues: 

We have had users report issues with certain versions of mountain lion.
If you encounter any issues please log an issue with as many details as
possible to aid us in fixing this.

## Using the extension :

Encrypting a message : 
The extension is hopefully easy enough to use , open up a gmail
window to begin. To encrypt a new message use
the compose button as normal , but you will notice that there is
a encrypt link next to the Rich Formatting link.

Clicking the button will encrypt the message that you are typing
with the public key for the current recepients. If they are not
found in your local pc keyring a error message will be displayed.

If no recepients or message is enterd a error message will be
displayed.

Decrypting a message :
Start of by clicking a email thread , this will show all mails
in that thread. Below each mail in the a Decrypt message link
will be shown.

Clicking the link will prompt you for your passphrase with
which to decrypt the message, a error will be show if no
valid gpg data can be found or if the passphrase is incorrect.

## Building the Extension :

Follow the intrsuction @ https://github.com/RC1140/cr-gpg/wiki/Compiling-extension-manually-(Linux) 
to build a custom version of the plugin , this is required for linux where various
architectures require specific builds.

## Debugging Extensions :

If you encounter a error or are unable to get the extension to run. Follow
the intstructions @ https://github.com/RC1140/cr-gpg/wiki/Debugging which
will allow you to find and fix any errors. This also assists when submitting
bug requests as it allows the developers to pin point a issue.

