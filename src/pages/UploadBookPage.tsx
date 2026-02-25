import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileText, X } from 'lucide-react';
import { ingestApi } from '@/api/endpoints';
import { useBookStore } from '@/stores/bookStore';
import { Button, Input, Card } from '@/components/ui';
import { cn } from '@/lib/utils';

type Mode = 'file' | 'text';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/epub+zip': ['.epub'],
  'text/plain': ['.txt'],
};

export default function UploadBookPage() {
  const navigate = useNavigate();
  const addBook = useBookStore((s) => s.addBook);

  const [mode, setMode] = useState<Mode>('file');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: false,
    onDropRejected: () => toast.error('Invalid file. Use PDF, EPUB, or TXT (max 50 MB).'),
  });

  const uploadFileMutation = useMutation({
    mutationFn: () => ingestApi.uploadFile(title, file!, authors || undefined),
    onSuccess: (data) => {
      addBook({ book_id: data.book_id, title, authors: authors || undefined });
      toast.success(`"${title}" uploaded (${data.chars.toLocaleString()} chars)`);
      navigate(`/books/${data.book_id}/topics`);
    },
    onError: () => toast.error('Upload failed. Please try again.'),
  });

  const uploadTextMutation = useMutation({
    mutationFn: () =>
      ingestApi.bookFromText({
        title,
        authors: authors || undefined,
        raw_text: rawText,
      }),
    onSuccess: (data) => {
      addBook({ book_id: data.book_id, title, authors: authors || undefined });
      toast.success(`"${title}" created!`);
      navigate(`/books/${data.book_id}/topics`);
    },
    onError: () => toast.error('Failed to create book. Please try again.'),
  });

  const isLoading = uploadFileMutation.isPending || uploadTextMutation.isPending;
  const canSubmit =
    title.trim() &&
    (mode === 'file' ? !!file : rawText.trim().length > 0) &&
    !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'file') {
      uploadFileMutation.mutate();
    } else {
      uploadTextMutation.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Book</h1>
        <p className="text-sm text-gray-500">
          Add study material to generate topics and quiz yourself
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Upload method">
        {(['file', 'text'] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            aria-controls={`panel-${m}`}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
              mode === m
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {m === 'file' ? 'Upload File' : 'Paste Text'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} aria-label="Upload book form">
        <Card className="space-y-5">
          {/* Title & Authors */}
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
            required
          />
          <Input
            label="Authors (optional)"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="Author name(s)"
          />

          {/* File panel */}
          {mode === 'file' && (
            <div id="panel-file" role="tabpanel">
              <label className="label">File</label>
              {file ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-brand-500" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                    isDragActive
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50',
                  )}
                >
                  <input {...getInputProps()} aria-label="Choose file to upload" />
                  <Upload
                    className="mx-auto mb-3 h-8 w-8 text-gray-400"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-gray-700">
                    {isDragActive
                      ? 'Drop your file here'
                      : 'Drag & drop or click to browse'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, EPUB, or TXT — max 50 MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text panel */}
          {mode === 'text' && (
            <div id="panel-text" role="tabpanel">
              <label htmlFor="raw-text" className="label">
                Study Material Text
              </label>
              <textarea
                id="raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your study material here…"
                rows={10}
                className="input-field resize-y font-mono text-xs"
                aria-describedby="text-hint"
              />
              <p id="text-hint" className="mt-1 text-xs text-gray-500">
                {rawText.length.toLocaleString()} characters
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" loading={isLoading} disabled={!canSubmit}>
            {mode === 'file' ? 'Upload & Process' : 'Create Book'}
          </Button>
        </Card>
      </form>
    </div>
  );
}
