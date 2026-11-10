import { BrowserRouter, Route, Routes } from 'react-router'
import '../tools/css/reset.css'
import '../tools/css/theme.css'
import '../tools/css/page.css'
import '../tools/css/ui.css'
import Layout from '../tools/components/Layout'
import Library from '../tools/pages/Library'
import Moods from '../tools/pages/Moods'
import Search from '../tools/pages/Search'
import Queue from '../tools/pages/Queue'
import Settings from '../tools/pages/Settings'
import NotFound from '../tools/pages/NotFound'

// add a page: create it in tools/pages, add a <Route> here and an item in Menu.tsx
export default function App() {
  return (
    <BrowserRouter>
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
