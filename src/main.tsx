import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GalleryPage } from '@/pages/gallery';
import { IdeaPage } from '@/pages/idea-page';
import { CommandPalette } from '@/components/command-palette';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/idea/:slug" element={<IdeaPage />} />
          <Route path="*" element={<IdeaPage />} />
        </Routes>
        <CommandPalette />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
