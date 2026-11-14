import { BrowserRouter, Route, Routes } from 'react-router'
import '../css/reset.css'
import '../css/theme.css'
import '../css/page.css'
import '../css/ui.css'
import Layout from '../components/Layout'
import Library from '../pages/Library'
import Moods from '../pages/Moods'
import Search from '../pages/Search'
import Queue from '../pages/Queue'
import Settings from '../pages/Settings'
import NotFound from '../pages/NotFound'
import { EMBED_BASE, isEmbed } from '../lib/embed'

// add a page: create it in pages, add a <Route> here and an item in Menu.tsx
// /myplayer/... serves these same routes without the navbar (lib/embed.ts)
export default function App() {
  return (
    <BrowserRouter basename={isEmbed ? EMBED_BASE : undefined}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Library />} />
          <Route path="p/:id" element={<Library />} />
          <Route path="moods" element={<Moods />} />
          <Route path="search" element={<Search />} />
          <Route path="queue" element={<Queue />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
