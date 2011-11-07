#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"

#include "gmailGPGAPI.h"

#include <stdio.h> 
#include <stdlib.h> 
#include <sys/types.h>
//#include <unistd.h> 
#include <iostream> 
#include <fstream>
#include <string> 
#include <algorithm>

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
    registerMethod("listPrivateKeys",     make_method(this, &gmailGPGAPI::listPrivateKeys));
    registerMethod("clearSignMessage",     make_method(this, &gmailGPGAPI::clearSignMessage));
    registerMethod("verifyMessage",     make_method(this, &gmailGPGAPI::verifyMessage));

    registerMethod("testOptions",     make_method(this, &gmailGPGAPI::testOptions));

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
    string tempFileLocation = m_tempPath + "errorMessage.txt";
    string tempOutputLocation = m_tempPath + "outputMessage.txt";
    string gpgFileLocation = "\""+m_appPath +"gpg.exe\" ";

    vector<string> peopleToSendTo = recipients.convert_cast<vector<string> >();
    string cmd = "c:\\windows\\system32\\cmd.exe /c ";
	cmd.append(gpgFileLocation);
	cmd.append("-e --armor");
    cmd.append(" --trust-model=always");
    for (unsigned int i = 0; i < peopleToSendTo.size(); i++) {
        cmd.append(" -r");
        cmd.append(peopleToSendTo.at(i));
    }
    cmd.append(" --output ");
    cmd.append(tempOutputLocation);
    cmd.append(" 2>");
    cmd.append(tempFileLocation);
	
    sendMessageToCommand(cmd,msg.convert_cast<string>());
	
    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
    string returnData = readAndRemoveErrorFile("outputMessage.txt");
	
	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());

    if(!errorMessageChecker.empty() && returnData.empty())
    {
        return errorMessage;
    }
    
    return returnData;
}

//Decrypts a message using the password provided and the message passed in , this does require
//that you have the private key installed locally.
FB::variant gmailGPGAPI::decryptMessage(const FB::variant& password,const FB::variant& msg)
{
    string tempFileLocation = m_tempPath + "tmpMessage.gpg";
    string tempOutputLocation = m_tempPath + "outputMessage.gpg";
    string errorFileLocation = m_tempPath + "errorMessage.txt";
    string gpgFileLocation = "\""+m_appPath +"gpg.exe\" ";

    string cmd = "cmd.exe /c ";
    ifstream fin(tempFileLocation.c_str());
    if(fin)
    {
        fin.close();
        remove(tempFileLocation.c_str());
    }
    ofstream encMessageContainer(tempFileLocation.c_str());
    
    if (encMessageContainer.is_open())
    {
        encMessageContainer << msg.convert_cast<string>().c_str();
        encMessageContainer.close();
    }
    
    //cmd.append("echo ");
    //cmd.append(password.convert_cast<string>());
    //cmd.append(" | ");
    cmd.append(gpgFileLocation);
    cmd.append(" --no-tty --passphrase-fd 0");
    cmd.append(" -d ");
    cmd.append(tempFileLocation);
    cmd.append(" 2>");
    cmd.append(errorFileLocation);
        
    string returnData = getMessageFromCommand(cmd);
    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
       
    remove(tempFileLocation.c_str());    

	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());

    if(!errorMessageChecker.empty() && returnData.empty())
    {
        return errorMessage;
    }
    
    return returnData;
}

string sendMessageToCommand(string command,string message){
    //return command;
    FILE *fp;
    int status;
    char path[200];
    string returnData ="";

    fp = _popen(command.c_str(), "w");
    if (fp == NULL)
        return "Unable to open Stream";

    fputs(message.c_str(),fp);
    status = _pclose(fp);
    if (status == -1) {
        return "stream close error";
    } else {
        return returnData;
    }
}

string getMessageFromCommand(string command){
    FILE *fp;
    int status;
    char path[200];
    fp = _popen(command.c_str(), "r");
    if (fp == NULL)
        return "";

    string returnData = "";
    while (fgets(path, 200, fp) != NULL)
        returnData.append(path);

    status = _pclose(fp);
    return returnData;
}


//Imports a users public key
FB::variant gmailGPGAPI::importKey(const FB::variant& pubKey)
{
    string errorFileLocation = m_tempPath + "errorMessage.txt";
    string tempOutputLocation = m_tempPath + "outputMessage.txt";
    string gpgFileLocation = "\""+m_appPath +"gpg.exe\" ";
    
    string cmd = "cmd.exe /c ";
    string tmpFileName = "/tmp/tmpMessage.gpg";
    
    cmd.append("echo \"");
    cmd.append(pubKey.convert_cast<string>());
    cmd.append("\" | ");
    cmd.append(gpgFileLocation);
    cmd.append(" --import");
    cmd.append(" 1>");
    cmd.append(tempOutputLocation);
    cmd.append(" 2>");
    cmd.append(errorFileLocation);

    exec(cmd);
    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
    string returnData = readAndRemoveErrorFile("errorMessage.txt");

	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());

    if(!errorMessageChecker.empty())
    {
        return errorMessage;
    }
    return returnData;
}


//Verifies wether a message is ok and has not been tampered with
FB::variant gmailGPGAPI::verifyMessage(const FB::variant& message)
{
    string errorFileLocation = m_tempPath + "errorMessage.txt";
    string tempFileLocation = m_tempPath + "tmpMessage.gpg";
    string gpgFileLocation = "\""+m_appPath +"gpg.exe\" ";
    
    string cmd = "cmd.exe /c ";
    cmd.append("echo \"");
    cmd.append(message.convert_cast<string>());
    cmd.append("\" | ");
    cmd.append(gpgFileLocation);
    cmd.append(" --no-tty --verify");
    cmd.append(" 1>");
    cmd.append(tempFileLocation);
    cmd.append(" 2>");
    cmd.append(errorFileLocation);
 
    exec(cmd);
    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
    string returnData = readAndRemoveErrorFile("errorMessage.txt");

	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());

    if(!errorMessageChecker.empty())
    {
        return errorMessage;
    }
    return returnData;
}

//Verifies wether a message is ok and has not been tampered with
FB::variant gmailGPGAPI::clearSignMessage(const FB::variant& message,const FB::variant& password)
{
    string tempFileLocation = m_tempPath + "tmpMessage.gpg";
    string errorFileLocation = m_tempPath + "errorMessage.txt";
    string clearSigFileLocation = m_tempPath + "tmpMessage.gpg.asc";
    
    string gpgFileLocation = "\""+m_appPath +"gpg.exe\" ";
    
    string returnData = "";
    string cmd = "cmd.exe /c ";
    
    ifstream fin(tempFileLocation.c_str());
    if(fin)
    {
        fin.close();
        remove(tempFileLocation.c_str());
    }
    ofstream encMessageContainer (tempFileLocation.c_str());
    
    if (encMessageContainer.is_open())
    {
        encMessageContainer << message.convert_cast<string>().c_str();
        encMessageContainer.close();
    }
    
    cmd.append("echo \"");
    cmd.append(password.convert_cast<string>());
    cmd.append("\" |");
    cmd.append(" ");
    cmd.append(gpgFileLocation);
    cmd.append(" --no-tty --passphrase-fd 0");
    cmd.append(" --clearsign ");
    cmd.append(tempFileLocation);
    cmd.append(" 2>");
    cmd.append(errorFileLocation);
   
    if (system(NULL)){

    }
    else{
        return ("");
    }

    system (cmd.c_str());
    string sigMessage = readAndRemoveErrorFile("tmpMessage.gpg.asc");
    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
    remove(tempFileLocation.c_str());    

	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());


    if(!errorMessageChecker.empty() && sigMessage.empty())
    {
        return errorMessage;
    }
    
    return sigMessage;
}

FB::variant gmailGPGAPI::listKeys()
{
    string errorFileLocation = m_tempPath +"errorMessage.txt";
    string tempFileLocation = m_tempPath + "tmpMessage.gpg";
    string gpgFileLocation = "cmd.exe /c \""+m_appPath +"gpg.exe\" ";
    
    string cmd = gpgFileLocation.append(" -k");
    cmd.append(" 1>");
    cmd.append(tempFileLocation);
    cmd.append(" 2>");
    cmd.append(errorFileLocation);
 
    exec(cmd);
    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
    string returnData = readAndRemoveErrorFile("tmpMessage.gpg");

	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());

    if(!errorMessageChecker.empty())
    {
        return errorMessage;
    }
    return returnData;
}

FB::variant gmailGPGAPI::listPrivateKeys()
{
    string errorFileLocation = m_tempPath +"errorMessage.txt";
    string tempFileLocation = m_tempPath + "tmpMessage.gpg";
    string gpgFileLocation = "cmd.exe /c \""+m_appPath +"gpg.exe\" ";
    
    string cmd = gpgFileLocation.append(" --list-secret-keys");
    cmd.append(" 1>");
    cmd.append(tempFileLocation);
    cmd.append(" 2>");
    cmd.append(errorFileLocation);

    exec(cmd);
    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
    string returnData = readAndRemoveErrorFile("tmpMessage.gpg");
	
	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());


    if(!errorMessageChecker.empty())
    {
        return errorMessage;
    }
    return returnData;
}

FB::variant gmailGPGAPI::testOptions()
{
    string errorFileLocation = m_tempPath +"errorMessage.txt";
    string tempFileLocation = m_tempPath + "tmpMessage.gpg";
    string gpgFileLocation = "\""+m_appPath +"gpg.exe\" ";
    
    string cmd = gpgFileLocation.append(" --version");
    cmd.append(" 2>");
    cmd.append(errorFileLocation);

    string errorMessage = readAndRemoveErrorFile("errorMessage.txt");
    string returnData = getMessageFromCommand(cmd);

	string errorMessageChecker;
    errorMessageChecker = errorMessage;
    errorMessageChecker.erase(std::remove(errorMessageChecker.begin(), errorMessageChecker.end(), '\n'), errorMessageChecker.end());

    if(!errorMessageChecker.empty() && returnData.empty())
    {
        return errorMessage;
    }
    return returnData;

}
