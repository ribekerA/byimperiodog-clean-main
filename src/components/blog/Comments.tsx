'use client';

import { MessageCircle, Send, ThumbsUp, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface Comment {
  id: string;
  post_id: string;
  author_name?: string | null;
  body: string;
  approved: boolean;
  created_at: string;
}

interface CommentsProps {
  postId: string;
}

export default function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { push: pushToast } = useToast();

  const [formData, setFormData] = useState({
    author_name: '',
    author_email: '',
    content: '',
  });

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/blog/comments?post_id=${postId}`);
      if (!response.ok) throw new Error('Erro ao carregar comentários');
      const data = await response.json();
      setComments(data.items || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      pushToast({ message: 'Por favor, escreva seu comentário', type: 'error' });
      return;
    }

    if (!formData.author_name.trim()) {
      pushToast({ message: 'Por favor, informe seu nome', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          author_name: formData.author_name.trim(),
          author_email: formData.author_email.trim() || undefined,
          body: formData.content.trim(),
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar comentário');

      pushToast({ 
        message: 'Comentário enviado! Aguarde aprovação da moderação.', 
        type: 'success' 
      });

      setFormData({ author_name: '', author_email: '', content: '' });
      fetchComments();
    } catch (error) {
      pushToast({ message: 'Erro ao enviar comentário. Tente novamente.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalComments = comments.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <section className="mt-16 border-t border-[var(--border)] pt-12">
      <div className="mb-8 flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-2xl font-bold text-[var(--text)]">
          Comentários {totalComments > 0 && `(${totalComments})`}
        </h2>
      </div>

      {/* Formulário de novo comentário */}
      <div className="mb-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[var(--text)]">
          Deixe seu comentário
        </h3>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="author_name" className="mb-2 block text-sm font-medium text-[var(--text)]">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                id="author_name"
                value={formData.author_name}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                placeholder="Seu nome"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="author_email" className="mb-2 block text-sm font-medium text-[var(--text)]">
                E-mail (opcional)
              </label>
              <Input
                id="author_email"
                type="email"
                value={formData.author_email}
                onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                placeholder="seu@email.com"
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Comentário <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Compartilhe sua opinião, dúvida ou experiência..."
              required
              disabled={submitting}
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              Seu comentário será moderado antes de aparecer
            </p>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar comentário
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-12 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
          <p className="text-lg font-medium text-[var(--text)]">
            Seja o primeiro a comentar!
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Compartilhe sua opinião e inicie a conversa
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="text-sm font-semibold">
              {(comment.author_name || 'Anônimo').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-[var(--text)]">{comment.author_name || 'Anônimo'}</p>
            <p className="text-xs text-[var(--text-muted)]">{formatDate(comment.created_at)}</p>
          </div>
        </div>
      </div>
      <p className="leading-relaxed text-[var(--text)]">{comment.body}</p>
      <div className="mt-4 flex items-center gap-4">
        <button className="flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
          <ThumbsUp className="h-4 w-4" />
          <span>Útil</span>
        </button>
      </div>
    </div>
  );
}
