/*
 * Note I have used various bit of code from 
 * https://github.com/gpgauth/gpgauth-npapi/blob/master/gpgAuthPlugin/
 *
 * The project is alot more mature than mine and
 * solved alot of the issues that I came across.
 *
 * */
#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"
#include "gmailGPGAPI.h"
#include <stdio.h> 
#include <stdlib.h> 
#include <sys/types.h>
#include <iostream> 
#include <fstream>
#include <string> 
#include <algorithm>
#include <sstream>
#include <gpgme.h>
#include "t-support.h"
#include "b64.c"

using namespace std;

gmailGPGAPI::gmailGPGAPI(const gmailGPGPtr& plugin, const FB::BrowserHostPtr& host) : m_plugin(plugin), m_host(host)
{
    registerMethod("encrypt",      make_method(this, &gmailGPGAPI::encryptMessage));
    registerMethod("decrypt",      make_method(this, &gmailGPGAPI::decryptMessage));
    registerMethod("importKey",    make_method(this, &gmailGPGAPI::importKey));
    registerMethod("listKeys",     make_method(this, &gmailGPGAPI::listKeys));
    registerMethod("listPrivateKeys",     make_method(this, &gmailGPGAPI::listPrivateKeys));
    registerMethod("clearSignMessage",     make_method(this, &gmailGPGAPI::clearSignMessage));
    registerMethod("verifyMessage",     make_method(this, &gmailGPGAPI::verifyMessage));
    registerMethod("verifyMessageDetached",     make_method(this, &gmailGPGAPI::verifyMessageWithDetachedFile));

    // Read-only property
    registerProperty("version",
                     make_property(this,
                        &gmailGPGAPI::get_version));
    registerProperty("appPath" ,make_property(this,&gmailGPGAPI::get_appPath,&gmailGPGAPI::set_appPath));    
    registerProperty("tempPath",make_property(this,&gmailGPGAPI::get_tempPath,&gmailGPGAPI::set_tempPath));
    
}

gmailGPGAPI::~gmailGPGAPI()
{
}

inline std::string i_to_str(const int &number)
{
    std::ostringstream oss;
    oss << number;
    return oss.str();
}

//Error handler file , this reads any messages that
//may have been stored in the errorMessage file
//and returns a string with this details to the caller.
//"errorMessage.txt"
std::string gmailGPGAPI::readAndRemoveErrorFile(const std::string fileName)
{        
    string errorFileLocation = m_tempPath + fileName;
    string returnData = "";
    string line;
    ifstream myfile;
    myfile.open(errorFileLocation.c_str());
    while ( myfile.good() )
    {
        getline (myfile,line);
        returnData.append(line);
        returnData.append("\n");
    }
    myfile.close();
    remove(errorFileLocation.c_str());
    return returnData;
}

std::string gmailGPGAPI::readTempFile(const std::string fileName)
{
    string returnData = "";
    string line;
    ifstream myfile;
    myfile.open(fileName.c_str());
    while ( myfile.good() )
    {
        getline (myfile,line);
        returnData.append(line);
        returnData.append("\n");
    }
    myfile.close();
    return returnData;
}

gmailGPGPtr gmailGPGAPI::getPlugin()
{
    gmailGPGPtr plugin(m_plugin.lock());
    if (!plugin) {
        throw FB::script_error("The plugin is invalid");
    }
    return plugin;
}

//Temp Path , this is where temp files are written
std::string gmailGPGAPI::get_tempPath()
{
    return m_tempPath;
}
void gmailGPGAPI::set_tempPath(const std::string& val)
{
    m_tempPath = val;
}

//App path , this is where the gpg app can be found
std::string gmailGPGAPI::get_appPath()
{
    return m_appPath;
}
void gmailGPGAPI::set_appPath(const std::string& val)
{
    m_appPath = val;
}

std::string gmailGPGAPI::get_version()
{
    return "0.7.7-beta";
}

string exec(string cmd) {
    if (system(NULL)){

    }
    else{ 
        return ("");
    }

    system (cmd.c_str());

    return "";
}

//Encrypts a message with the list of recipients provided
FB::variant gmailGPGAPI::encryptMessage(const FB::variant& recipients,const FB::variant& msg)
{
    vector<string> peopleToSendTo = recipients.convert_cast<vector<string> >();
    string returnData = "";

    gpgme_ctx_t ctx;
    gpgme_error_t err;
    gpgme_data_t in, out;
    //peopleToSendTo.size()
    gpgme_key_t key[peopleToSendTo.size()+1];// = {NULL,NULL,NULL};

    init_gpgme (GPGME_PROTOCOL_OpenPGP);

    err = gpgme_new (&ctx);
    gpgme_set_armor (ctx, 1);

    for(unsigned int i=0;i<peopleToSendTo.size();i++)
    {
        err = gpgme_get_key (ctx, peopleToSendTo.at(i).c_str(), &key[i], 0);
    }
    key[peopleToSendTo.size()] = NULL;
    gpgme_encrypt_result_t result;

    err = gpgme_data_new_from_mem (&in, msg.convert_cast<string>().c_str(), msg.convert_cast<string>().length()+1, 1);
    //err = gpgme_data_new_from_mem (&in, "Hallo Leute\n", 12, 0);
    //fail_if_err (err);

    err = gpgme_data_new (&out);
    //fail_if_err (err);

    err = gpgme_op_encrypt (ctx, key, GPGME_ENCRYPT_ALWAYS_TRUST, in, out);
    //fail_if_err (err);
    result = gpgme_op_encrypt_result (ctx);
    //if (result->invalid_recipients)
    //{
     // fprintf (stderr, "Invalid recipient encountered: %s\n",
      //     result->invalid_recipients->fpr);
      //exit (1);
    //}
    
    size_t out_size = 0;
    char* out_buf = gpgme_data_release_and_get_mem(out, &out_size);
    std::string returnMessage = std::string(out_buf);
    out = NULL;

    //returnData = print_data (out);
    for(int i=0;i<peopleToSendTo.size();i++)
    {
        gpgme_key_unref (key[i]);
    }

    gpgme_data_release (in);
    gpgme_data_release (out);
    gpgme_release (ctx);
    return returnMessage;
}

//Decrypts a message using the password provided and the message passed in , this does require
//that you have the private key installed locally.
FB::variant gmailGPGAPI::decryptMessage(const FB::variant& msg)
{
    gpgme_ctx_t ctx;
    gpgme_error_t err;
    gpgme_data_t in, out;
    gpgme_decrypt_result_t result;
    char *agent_info;

    init_gpgme (GPGME_PROTOCOL_OpenPGP);

    err = gpgme_new (&ctx);
    string returnData = gpgme_strerror(err);
    
    //fail_if_err (err);

    agent_info = getenv("GPG_AGENT_INFO");
    if (!(agent_info && strchr (agent_info, ':')))
        gpgme_set_passphrase_cb (ctx, NULL, NULL);

    err = gpgme_data_new_from_mem(&in, msg.convert_cast<string>().c_str(),msg.convert_cast<string>().length(),1);
    returnData = gpgme_strerror(err);
    //fail_if_err (err);

    err = gpgme_data_new (&out);
    returnData = gpgme_strerror(err);
    //fail_if_err (err);

    err = gpgme_op_decrypt (ctx, in, out);

    size_t out_size = 0;
    char* out_buf = gpgme_data_release_and_get_mem (out, &out_size);
    std::string returnMessage = std::string(out_buf);
    out = NULL;

    returnData = gpgme_strerror(err);
    result = gpgme_op_decrypt_result (ctx);
    /*
    if (result->unsupported_algorithm)
    {
        fprintf (stderr, "%s:%i: unsupported algorithm: %s\n",
                __FILE__, __LINE__, result->unsupported_algorithm);
        exit (1);
    }
    */
    //returnData = print_data(out);
    //returnData = gpgme_data_release_and_get_mem (out, &out_size);
    gpgme_data_release (in);
    gpgme_data_release (out);
    gpgme_release (ctx);
    return returnMessage;
}

//Imports a users public key
FB::variant gmailGPGAPI::importKey(const FB::variant& pubKey)
{
    gpgme_ctx_t ctx;
    gpgme_error_t err;
    gpgme_data_t in;
    gpgme_import_result_t result;

    init_gpgme (GPGME_PROTOCOL_OpenPGP);

    err = gpgme_new (&ctx);
    //fail_if_err (err);

    err = gpgme_data_new_from_mem(&in, pubKey.convert_cast<string>().c_str(),pubKey.convert_cast<string>().length(),1);
    //fail_if_err (err);

    err = gpgme_op_import (ctx, in);
    //fail_if_err (err);
    
    result = gpgme_op_import_result (ctx);

    gpgme_data_release (in);
    gpgme_release (ctx);
    return "OK";
}


//Verifies wether a message is ok and has not been tampered with
FB::variant gmailGPGAPI::verifyMessage(const FB::variant& message)
{
    try {
        gpgme_ctx_t ctx;
        gpgme_error_t err;
        gpgme_verify_result_t result;
        init_gpgme (GPGME_PROTOCOL_OpenPGP);
        err = gpgme_new (&ctx);

        gpgme_data_t msg, out;
        err = gpgme_data_new_from_mem (&msg, message.convert_cast<string>().c_str(), message.convert_cast<string>().length()+1, 1);
        err = gpgme_data_new(&out);
        err = gpgme_op_verify (ctx, msg, NULL, out);
        result = gpgme_op_verify_result (ctx);

        if(result->signatures)
        {
            return result->signatures->summary;
        }
        size_t out_size = 0;
        char* msg_buf = gpgme_data_release_and_get_mem (out, &out_size);
        std::string returnMessage = std::string(msg_buf);
        msg = NULL;

        return returnMessage;
    }
    catch(exception& e)
    {
        return "Error Occured , Bad Message"; 
    }
}

//Verifies wether a message is ok and has not been tampered with
FB::variant gmailGPGAPI::verifyMessageWithDetachedFile(const FB::variant& message,const FB::variant& sig)
{
    //Store the base64 data into the tmpMessage file.
    string tempFileLocation = m_tempPath + "tmpSig";
    //The path below is where the base64 decoder will dump the binary data.
    string tempFileLocationFinal = m_tempPath + "tmpMessage.sig";
    string tempMessageLocation = m_tempPath + "tmpMessage";

    ofstream sigFile(tempFileLocation.c_str());
    //Open file convert variable to text and dump data
    if(sigFile.is_open())
    {
        sigFile << sig.convert_cast<string>().c_str();
        sigFile.close();
    }

    ofstream msgFile(tempMessageLocation.c_str());
    //Open file convert variable to text and dump data
    if(msgFile.is_open())
    {
        msgFile<< message.convert_cast<string>().c_str() <<endl;
        msgFile.close();
    }

    //Convert the dumped data to binary , this data has been verified by manually testing it with gpg 
    b64(100,(char *)tempFileLocation.c_str(), (char *)tempFileLocationFinal.c_str(), 72 );

    try {
        gpgme_ctx_t ctx;
        gpgme_error_t err;
        gpgme_verify_result_t result;
        init_gpgme (GPGME_PROTOCOL_OpenPGP);
        err = gpgme_new (&ctx);
        //fail_if_err(err);

        gpgme_data_t msg, sigData;
        FILE *fp2=fopen(tempMessageLocation.c_str(), "r");
        err = gpgme_data_new_from_stream(&msg,fp2);
        //fail_if_err(err);

        FILE *fp=fopen(tempFileLocationFinal.c_str(), "rb");
        err = gpgme_data_new_from_stream(&sigData,fp);
        //fail_if_err(err);
        err = gpgme_op_verify (ctx, sigData ,msg, NULL);
        //fail_if_err(err);
        result = gpgme_op_verify_result (ctx);

        fclose(fp);
        fclose(fp2);
        if(result->signatures)
        {
           return gpgme_strerror(result->signatures->status);
           //return result->signatures->summary;
        }
        return gpgme_strerror(err);
    }
    catch(exception& e)
    {
        return "Error Occured , Bad Message"; 
    }
}


FB::variant gmailGPGAPI::clearSignMessage(const FB::variant& message)
{
    gpgme_ctx_t ctx;
    gpgme_data_t in, out;
    gpgme_error_t err;
    gpgme_sign_result_t result;

    init_gpgme (GPGME_PROTOCOL_OpenPGP);
    err = gpgme_new (&ctx);

    char *agent_info = getenv ("GPG_AGENT_INFO");
    if (!(agent_info && strchr (agent_info, ':')))
        gpgme_set_passphrase_cb (ctx, passphrase_cb, NULL);

    gpgme_set_armor (ctx, 1);

    err = gpgme_data_new_from_mem (&in, message.convert_cast<string>().c_str(), message.convert_cast<string>().length(), 1);
    err = gpgme_data_new (&out);
    err = gpgme_op_sign (ctx, in, out, GPGME_SIG_MODE_CLEAR);

    result = gpgme_op_sign_result (ctx);

    size_t out_size = 0;
    char* out_buf = gpgme_data_release_and_get_mem(out, &out_size);
    std::string returnData = std::string(out_buf);
    out = NULL;

    gpgme_data_release (in);
    gpgme_data_release (out);
    gpgme_release (ctx);

    return returnData; 
}

FB::variant gmailGPGAPI::listKeys(const std::string& domain,int secret_only)
{
    gpgme_ctx_t ctx;
    gpgme_error_t err;
    init_gpgme (GPGME_PROTOCOL_OpenPGP);
    err = gpgme_new (&ctx);

    gpgme_key_t key;
    gpgme_keylist_result_t result;
    gpgme_user_id_t uid;
    gpgme_key_sig_t sig;
    gpgme_subkey_t subkey;
    FB::VariantMap keylist_map;

    FB::VariantMap uid_map;

    err = gpgme_set_protocol(ctx, GPGME_PROTOCOL_OpenPGP);
    if(err != GPG_ERR_NO_ERROR)
        return "Protocol loading failed"; //get_error_map(__func__, gpgme_err_code (err), gpgme_strerror (err), __LINE__, __FILE__);

    /* apply the keylist mode to the context and set
        the keylist_mode 
        NOTE: The keylist mode flag GPGME_KEYLIST_MODE_SIGS 
            returns the signatures of UIDS with the key */
    gpgme_set_keylist_mode (ctx, (gpgme_get_keylist_mode (ctx)
                                | GPGME_KEYLIST_MODE_VALIDATE 
                                | GPGME_KEYLIST_MODE_SIGS));

    /* gpgme_op_keylist_start (gpgme_ctx_t ctx, const char *pattern, int secret_only) */
    if (domain.length() > 0){ // limit key listing to search criteria 'domain'
        err = gpgme_op_keylist_start (ctx, domain.c_str(), 0);
    } else { // list all keys
        err = gpgme_op_keylist_ext_start (ctx, NULL, secret_only, 0);
    }
    if(err != GPG_ERR_NO_ERROR)
        return "Something Broke";//get_error_map(__func__, gpgme_err_code (err), gpgme_strerror (err), __LINE__, __FILE__);
        //return keylist_map["error"] = "error: 3; Problem with keylist_start";

    while (!(err = gpgme_op_keylist_next (ctx, &key)))
     {
        int nsigs;
        int tnsigs;
        FB::VariantMap key_map;

        if (key->uids && key->uids->name)
            key_map["name"] = nonnull (key->uids->name);
        if (key->subkeys && key->subkeys->fpr)
            key_map["fingerprint"] = nonnull (key->subkeys->fpr);
        if (key->uids && key->uids->email)
            key_map["email"] = nonnull (key->uids->email);
        key_map["expired"] = key->expired? true : false;
        key_map["revoked"] = key->revoked? true : false;
        key_map["disabled"] = key->disabled? true : false;
        key_map["invalid"] = key->invalid? true : false;
        key_map["secret"] = key->secret? true : false;
        key_map["protocol"] = key->protocol == GPGME_PROTOCOL_OpenPGP? "OpenPGP":
            key->protocol == GPGME_PROTOCOL_CMS? "CMS":
            key->protocol == GPGME_PROTOCOL_UNKNOWN? "Unknown": "[?]";
        key_map["can_encrypt"] = key->can_encrypt? true : false;
        key_map["can_sign"] = key->can_sign? true : false;
        key_map["can_certify"] = key->can_certify? true : false;
        key_map["can_authenticate"] = key->can_authenticate? true : false;
        key_map["is_qualified"] = key->is_qualified? true : false;

        keylist_map[key->subkeys->keyid] = key_map;
        gpgme_key_unref (key);
    }

    if (gpg_err_code (err) != GPG_ERR_EOF) exit(6);
    err = gpgme_op_keylist_end (ctx);
    if(err != GPG_ERR_NO_ERROR) exit(7);
    result = gpgme_op_keylist_result (ctx);
    if (result->truncated)
     {
        return "Results Truncated";//get_error_map(__func__, gpgme_err_code (err), gpgme_strerror (err), __LINE__, __FILE__);
        //return keylist_map["error"] = "error: 4; Key listing unexpectedly truncated";
     }
    gpgme_release (ctx);
    return keylist_map;
}

FB::variant gmailGPGAPI::listPrivateKeys()
{
    return listKeys(NULL,1);
}
