echo '[*] Making Dir cr-gpg-dev'
mkdir cr-gpg-dev
echo '[*] Changing into Dir cr-gpg-dev'
cd cr-gpg-dev
echo '[*] Cloning firebreath into folder firebreath-dev'
git clone git://github.com/firebreath/FireBreath.git firebreath-dev
echo '[*] Changing into Dir firebreath-dev'
cd firebreath-dev
echo '[*] Updated submodules for firebreath'
git submodule update --recursive --init
echo '[*] Changing Dir back into cr-gpg-dev'
cd ..
echo '[*] Cloning cr-gpg into folder cr-gpg'
git clone https://github.com/RC1140/cr-gpg.git cr-gpg
echo '[*] Making projects folder for firebreath'
mkdir -p firebreath-dev/projects/gmailGPG
echo '[*] Copying cr-gpg into projects folder'
cp -r cr-gpg/gmailGPG/generic/* firebreath-dev/projects/gmailGPG/
echo '[*] Changing into firebreath folder'
cd firebreath-dev
echo '[*] Running make preperation script'
./prepmake.sh
echo '[*] Changing into build folder'
cd build
echo '[*] Starting build'
make
echo '[*] Assuming everything is built fine , copying binary into the extension folder'
cp bin/gmailGPG/npgmailGPG.so ../../cr-gpg/chromeExtension/gmailGPG.so
echo 'You can now load the plugin by using [Developer Mode -> Load Unpacked Extension ]'
