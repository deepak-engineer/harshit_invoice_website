const fs = require('fs');

const frontendPath = 'c:\\xampp\\htdocs\\harshit_invoice_website\\frontend\\src\\pages\\Login.jsx';
let frontendContent = fs.readFileSync(frontendPath, 'utf8');

// Replace standard useState(false) with sessionStorage initialization
frontendContent = frontendContent.replace(
    /const \[isSignUp, setIsSignUp\] = useState\(false\);/,
    `const [isSignUp, setIsSignUp] = useState(() => {
    return sessionStorage.getItem('isSignUp') === 'true';
  });`
);

// We need to sync isSignUp changes to sessionStorage
// Let's add a useEffect for it.
const useEffectReplacement = `
  useEffect(() => {
    sessionStorage.setItem('isSignUp', isSignUp);
  }, [isSignUp]);
`;

// Insert the useEffect right after the state declarations (e.g., after `const [isResending, setIsResending] = useState(false);`)
frontendContent = frontendContent.replace(
    /const \[isResending, setIsResending\] = useState\(false\);/,
    "const [isResending, setIsResending] = useState(false);\n" + useEffectReplacement
);


fs.writeFileSync(frontendPath, frontendContent, 'utf8');
console.log("SessionStorage sync added for isSignUp");
