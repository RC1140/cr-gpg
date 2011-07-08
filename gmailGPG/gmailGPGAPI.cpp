/**********************************************************\

  Auto-generated gmailGPGAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"

#include "gmailGPGAPI.h"

#include <stdio.h> 
#include <stdlib.h> 
#include <sys/types.h>
#include <unistd.h> 
#include <iostream> 
#include <fstream>
#include <string> 

using namespace std;


///////////////////////////////////////////////////////////////////////////////
/// @fn gmailGPGAPI::gmailGPGAPI(const gmailGPGPtr& plugin, const FB::BrowserHostPtr host)
///
/// @brief  Constructor for your JSAPI object.  You should register your methods, properties, and events
///         that should be accessible to Javascript from here.
///
/// @see FB::JSAPIAuto::registerMethod
/// @see FB::JSAPIAuto::registerProperty
/// @see FB::JSAPIAuto::registerEvent
///////////////////////////////////////////////////////////////////////////////
gmailGPGAPI::gmailGPGAPI(const gmailGPGPtr& plugin, const FB::BrowserHostPtr& host) : m_plugin(plugin), m_host(host)
{
    registerMethod("encrypt",      make_method(this, &gmailGPGAPI::encryptMessage));
    registerMethod("decrypt",      make_method(this, &gmailGPGAPI::decryptMessage));
    registerMethod("importKey",    make_method(this, &gmailGPGAPI::importKey));
    registerMethod("listKeys",     make_method(this, &gmailGPGAPI::listKeys));

    // Read-only property
    registerProperty("version",
                     make_property(this,
                        &gmailGPGAPI::get_version));
    registerProperty("appPath" ,make_property(this,&gmailGPGAPI::get_appPath,&gmailGPGAPI::set_appPath));    
    registerProperty("tempPath",make_property(this,&gmailGPGAPI::get_tempPath,&gmailGPGAPI::set_tempPath));
    
}

///////////////////////////////////////////////////////////////////////////////
/// @fn gmailGPGAPI::~gmailGPGAPI()
///
/// @brief  Destructor.  Remember that this object will not be released until
///         the browser is done with it; this will almost definitely be after
///         the plugin is released.
///////////////////////////////////////////////////////////////////////////////
gmailGPGAPI::~gmailGPGAPI()
{
}

///////////////////////////////////////////////////////////////////////////////
/// @fn gmailGPGPtr gmailGPGAPI::getPlugin()
///
/// @brief  Gets a reference to the plugin that was passed in when the object
///         was created.  If the plugin has already been released then this
///         will throw a FB::script_error that will be translated into a
///         javascript exception in the page.
///////////////////////////////////////////////////////////////////////////////
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
    return "0.5.5";
}

void gmailGPGAPI::testEvent(const FB::variant& var)
{
    fire_fired(var, true, 1);
}

string exec(string cmd) {
    FILE* pipe = popen(cmd.c_str(), "r");
    if (!pipe) return "ERROR";
    char buffer[128];
    std::string result = "";
    while(!feof(pipe)) {
        if(fgets(buffer, 128, pipe) != NULL)
            result += buffer;
    }
    pclose(pipe);
    return result;
}

//Encrypts a message with the list of recipients provided
FB::variant gmailGPGAPI::encryptMessage(const FB::variant& recipients,const FB::variant& msg)
{
    string tempFileLocation = m_tempPath + "errorMessage.txt";
    string gpgFileLocation = m_appPath + "gpg ";
    vector<string> peopleToSendTo = recipients.convert_cast<vector<string> >();
    string returnData = "";
    string cmd = "";
    cmd.append("echo \"");
    cmd.append(msg.convert_cast<string>());
    cmd.append("\" |");
    cmd.append(" ");
    cmd.append(gpgFileLocation);
    cmd.append("--encrypt --no-tty --armor");
    cmd.append(" --trust-model=always");
    for (unsigned int i = 0; i < peopleToSendTo.size(); i++) {
        cmd.append(" -r ");
        cmd.append(peopleToSendTo.at(i));
    }
    cmd.append(" 2>");
    cmd.append(tempFileLocation);
    returnData = exec(cmd);
    string errorMessage = readAndRemoveErrorFile();
    if(!errorMessage.empty() && returnData.empty())
    {
        return errorMessage;
    }
    
    return returnData;
}

//Error handler file , this reads any messages that
//may have been stored in the errorMessage file
//and returns a string with this details to the caller.
std::string gmailGPGAPI::readAndRemoveErrorFile()
{
    string errorFileLocation = m_tempPath + "errorMessage.txt";
    string tmp;
    
    ifstream infile(errorFileLocation.c_str());
    string returnMessage = "";
    while(!infile.eof()) {
        getline(infile, tmp);

        if(!tmp.empty()){
            returnMessage.append(tmp);
            returnMessage.append("\n");
        }
    }
    infile.close();
    remove(errorFileLocation.c_str());
    return returnMessage;        
}

//Decrypts a message using the password provided and the message passed in , this does require
//that you have the private key installed locally.
FB::variant gmailGPGAPI::decryptMessage(const FB::variant& password,const FB::variant& msg)
{
    string tempFileLocation = m_tempPath + "tmpMessage.gpg";
    string errorFileLocation = m_tempPath + "errorMessage.txt";
    string gpgFileLocation = m_appPath + "gpg ";

    string returnData = "";
    string cmd = "";

    ifstream fin(tempFileLocation.c_str());
    if(fin)
    {
        fin.close();
        remove(tempFileLocation.c_str());
    }
    ofstream encMessageContainer (tempFileLocation.c_str());
    
    if (encMessageContainer.is_open())
    {
        encMessageContainer << msg.convert_cast<string>().c_str();
        encMessageContainer.close();
    }
    
    cmd.append("echo \"");
    cmd.append(password.convert_cast<string>());
    cmd.append("\" |");
    cmd.append(" ");
    cmd.append(gpgFileLocation);
    cmd.append(" --no-tty --passphrase-fd 0");
    cmd.append(" -d ");
    cmd.append(tempFileLocation);
    cmd.append(" 2>");
    cmd.append(errorFileLocation);
    
    returnData = exec(cmd);
    remove(tempFileLocation.c_str());    
    
    string errorMessage = readAndRemoveErrorFile();
    if(!errorMessage.empty() && returnData.empty())
    {
        return errorMessage;
    }
    
    return returnData;
}

//Imports a users public key
FB::variant gmailGPGAPI::importKey(const FB::variant& pubKey)
{
    string errorFileLocation = m_tempPath + "errorMessage.txt";
    string gpgFileLocation = m_appPath + "gpg ";
    freopen (errorFileLocation.c_str(),"w",stderr);   
    
    string returnData = "";
    string cmd = "";
    string tmpFileName = "/tmp/tmpMessage.gpg";
    
    cmd.append("echo \"");
    cmd.append(pubKey.convert_cast<string>());
    cmd.append("\" | ");
    cmd.append(gpgFileLocation);
    cmd.append(" --import");
    returnData = exec(cmd);
    
    fclose(stderr);
    stderr = fdopen(STDERR_FILENO, "w");
    string errorMessage = readAndRemoveErrorFile();
    if(!errorMessage.empty())
    {
        return errorMessage;
    }
    return returnData;
}

FB::variant gmailGPGAPI::listKeys()
{
    string errorFileLocation = m_tempPath +"errorMessage.txt";
    string gpgFileLocation = m_appPath +" gpg ";
    freopen (errorFileLocation.c_str(),"w",stderr);   
    
    string returnData = "";
    string cmd = gpgFileLocation.append(" -k");
    returnData = exec(cmd);
    
    fclose(stderr);
    stderr = fdopen(STDERR_FILENO, "w");
    string errorMessage = readAndRemoveErrorFile();
    if(!errorMessage.empty())
    {
        return errorMessage;
    }
    return returnData;
}
