/** Cada pantalla del panel entra con un fundido corto; el menú y la barra no se mueven. */
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="motion-page-in">{children}</div>;
}
