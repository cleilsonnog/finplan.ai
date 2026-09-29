import packageJson from "../../package.json";

const Footer = () => {
  return (
    <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} FinPlan.ai — Todos os direitos reservados · v{packageJson.version}
    </footer>
  );
};

export default Footer;
