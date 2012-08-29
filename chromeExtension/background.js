var alerted = false;
function plugin0()
{
    return document.getElementById('plugin0');
}

chrome.extension.onRequest.addListener(
function(request, sender, sendResponse) {
var gpgPath = localStorage['gpgPath'];
var tempPath = localStorage['tempPath'];
if(!gpgPath){
    gpgPath = '/opt/local/bin/'; 
};
if(!tempPath){
    tempPath = '/tmp/'; 
};
plugin0().appPath = gpgPath;
plugin0().tempPath = tempPath;
if (request.messageType == 'encrypt'){
    var mailList = request.encrypt.maillist.filter(function(val) { return val !== null; });
    if( localStorage["useAutoInclude"] && localStorage["useAutoInclude"] != 'false'){
        mailList.push(localStorage["personaladdress"]);
    }
    var mailMessage = request.encrypt.message;
    var enc_result = plugin0().gpgEncrypt(mailMessage, mailList, '', '');
    //plugin0().encrypt(mailList,mailMessage)
    if(enc_result.data){
        sendResponse({message: enc_result.data,domid:request.encrypt.domel});
    }else{
        sendResponse({message: 'Something Failed',domid:request.encrypt.domel});
    };
}else if(request.messageType == 'sign'){
    sendResponse({message: plugin0().clearSignMessage(request.sign.message),domid:request.sign.domel});
}else if(request.messageType == 'verify'){
    var returnMessage = plugin0().verifyMessage(request.verify.message);
    sendResponse({message: returnMessage.toString() ,domid:request.verify.domel});
}else if(request.messageType == 'verifyDetached'){
    sendResponse({message: plugin0().verifyMessageDetached(request.verify.message,request.verify.sig),domid:request.verify.domel});
}else if(request.messageType == 'decrypt'){
        //Make sure you handle the multidec call which handles encryption within encryption
        var dec_result = plugin0().gpgDecrypt(request.decrypt.message);
        console.log(dec_result);
        if(!dec_result.error){
            sendResponse({message: dec_result.data,domid:request.decrypt.domel});
        }else{
            sendResponse({message: 'An Error Occured',domid:request.decrypt.domel});
        };
}else if(request.messageType == 'optionLoad'){
    chrome.tabs.create({'selected':true,'url': chrome.extension.getURL('options.html')});
    sendResponse('options opened');
    }else if(request.messageType == 'testSettings'){
    plugin0().appPath = localStorage['gpgPath'];
    plugin0().tempPath = localStorage['tempPath'];
    var returnMessage = plugin0().testOptions();
    if(returnMessage.indexOf('http://gnu.org/licenses/gpl.html') != -1){
        if(localStorage["useAutoInclude"] && localStorage["useAutoInclude"] != 'false'){
            var messageblock = plugin0().encrypt([localStorage["personaladdress"]],'Test Message');
            if(messageblock.indexOf('-----BEGIN PGP MESSAGE-----') != 0){
                sendResponse('selfsign failed');
                return;
                }else{
                sendResponse('ok');
            }
            }else{
            sendResponse('ok');
        };
        }else{
        sendResponse('failed');
    }   
}
});