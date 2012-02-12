
#include <string>
#include <sstream>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "gmailGPG.h"

#ifndef H_gmailGPGAPI
#define H_gmailGPGAPI

class gmailGPGAPI : public FB::JSAPIAuto
{
public:
    gmailGPGAPI(const gmailGPGPtr& plugin, const FB::BrowserHostPtr& host);
    virtual ~gmailGPGAPI();

    gmailGPGPtr getPlugin();

    std::string get_appPath();
    void set_appPath(const std::string& val);
    std::string get_tempPath();
    void set_tempPath(const std::string& val);

    std::string get_version();

    std::string readAndRemoveErrorFile(std::string);
    std::string readTempFile(const std::string );
    std::string readFileClean(std::string fileName);
    FB::variant encryptMessage(const FB::variant& recipients,const FB::variant& msg);
    FB::variant decryptMessage(const FB::variant& password,const FB::variant& msg);
    FB::variant importKey(const FB::variant& pubKey);
    FB::variant listKeys();
    FB::variant listPrivateKeys();
    FB::variant clearSignMessage(const FB::variant& message,const FB::variant& password);
    FB::variant verifyMessage(const FB::variant& message);
    FB::variant testOptions();
    FB::variant verifyMessageWithDetachedFile(const FB::variant& message,const FB::variant& sig);
    
    FB_JSAPI_EVENT(fired, 3, (const FB::variant&, bool, int));
    FB_JSAPI_EVENT(echo, 2, (const FB::variant&, const int));
    FB_JSAPI_EVENT(notify, 0, ());

    // Method test-event
    void testEvent(const FB::variant& s);

private:
    gmailGPGWeakPtr m_plugin;
    FB::BrowserHostPtr m_host;

    std::string m_testString;
    std::string m_appPath;
    std::string m_tempPath;
};

#endif // H_gmailGPGAPI

