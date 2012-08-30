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
    if(!enc_result.error && enc_result.data){
        sendResponse({message: enc_result.data,domid:request.encrypt.domel});
    }else{
        //console.log(enc_result);
        sendResponse({error:true,message: enc_result.error_string,domid:request.encrypt.domel});
    };
}else if(request.messageType == 'importkey'){
    var import_status = plugin0().gpgImportKey(request.import.message);
    sendResponse({message: import_status});
}else if(request.messageType == 'sign'){
    var signing_key = plugin0().gpgGetPreference('default-key').value
    var sign_status = plugin0().gpgSignText([signing_key],request.sign.message, 2);
    sendResponse({message: sign_status,domid:request.sign.domel});
}else if(request.messageType == 'verify'){    
    var verify_status = plugin0().gpgVerify(request.verify.message);
    sendResponse({message: verify_status ,domid:request.verify.domel})
    // var returnMessage = plugin0().verifyMessage(request.verify.message);
    // sendResponse({message: returnMessage.toString() ,domid:request.verify.domel});
}else if(request.messageType == 'verifyDetached'){
    sendResponse({message:'Not Yet Support',domid:request.verify.domel});
    //sendResponse({message: plugin0().verifyMessageDetached(request.verify.message,request.verify.sig),domid:request.verify.domel});
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
    var returnMessage = plugin0().getPublicKeyList();
    sendResponse(returnMessage);   
}
});