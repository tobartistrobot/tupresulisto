const fs = require('fs');

let c = fs.readFileSync('src/components/v30/SysConfig.js', 'utf8');

c = c.replace(/const processImage = \([\\s\\S]*?\}\);\s*const SysConfig/m, "import { useSysConfig } from '../../hooks/useSysConfig';\n\nconst SysConfig");

c = c.replace(/const \[couponCode, setCouponCode\] = useState\(''\);\s*const \[isRedeeming, setIsRedeeming\] = useState\(false\);\s*\/\/ SECURITY STATE\s*const \[currentPassword, setCurrentPassword\] = useState\(''\);\s*const \[newPassword, setNewPassword\] = useState\(''\);\s*const \[confirmNewPassword, setConfirmNewPassword\] = useState\(''\);\s*const \[securityLoading, setSecurityLoading\] = useState\(false\);\s*\/\/ Check provider \(google\.com vs password\)\s*const isGoogleUser = user\?\.providerData\?\.some\(p => p\.providerId === 'google\.com'\);\s*const handleLogo = async \(e\) => \{[\s\S]*?handleRedeem = async \(\) => \{[\s\S]*?handleChangePassword = async \(\) => \{[\s\S]*?\}\s*finally\s*\{\s*setSecurityLoading\(false\);\s*\}\s*\};\s*return \(\s*<div/m, `const {
        couponCode, setCouponCode, isRedeeming, handleRedeem,
        currentPassword, setCurrentPassword, newPassword, setNewPassword,
        confirmNewPassword, setConfirmNewPassword, securityLoading, handleChangePassword, isGoogleUser,
        handleLogo,
        handleExportCatalog, handleImportCatalog
    } = useSysConfig({ user, config, setConfig, products, categories, setProducts, setCategories, toast });

    return (
        <div`);

c = c.replace(/onClick=\{\(\) => \{\s*const dataStr[\s\S]*?toast\("Catálogo exportado correctamente", "success"\);\s*\}\}/m, "onClick={handleExportCatalog}");

c = c.replace(/onChange=\{\(e\) => \{\s*const file = e\.target\.files\[0\];[\s\S]*?e\.target\.value = null; \/\/ Reset input\s*\}\}/m, "onChange={(e) => { handleImportCatalog(e.target.files[0]); e.target.value = null; }}");

fs.writeFileSync('src/components/v30/SysConfig.js', c);
console.log('Refactor aplicado a SysConfig.js');
