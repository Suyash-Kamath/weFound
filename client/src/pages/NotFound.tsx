// import { useLocation } from "react-router-dom";
// import { useEffect } from "react";

// const NotFound = () => {
//   const location = useLocation();

//   useEffect(() => {
//     console.error("404 Error: User attempted to access non-existent route:", location.pathname);
//   }, [location.pathname]);

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-muted">
//       <div className="text-center">
//         <h1 className="mb-4 text-4xl font-bold">404</h1>
//         <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
//         <a href="/" className="text-primary underline hover:text-primary/90">
//           Return to Home
//         </a>
//       </div>
//     </div>
//   );
// };

// export default NotFound;
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    // Use the existing 'page-wrapper' or a new 'not-found-wrapper' based on your layout structure
    <div className="not-found-wrapper flex-center">
      <div className="not-found-card animate-fade-in">
        
        {/* The massive 404 number, using a text gradient */}
        <h1 className="not-found-code text-gradient">404</h1>
        
        {/* Main error message */}
        <p className="not-found-message">Oops! Looks like you're lost.</p>
        
        {/* Detailed description */}
        <p className="not-found-description">
          The page you requested might have been moved, deleted, or you might have mistyped the address.
        </p>
        
        {/* Call to Action Button */}
        <a href="/" className="btn btn-primary not-found-cta">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Go Back Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;