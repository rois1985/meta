export function Logo({ size = 'md', showText = false }) {
  return (
    <div className="flex items-center">
      <img 
        src="/idmeta-logo.svg" 
        alt="idMETA Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
