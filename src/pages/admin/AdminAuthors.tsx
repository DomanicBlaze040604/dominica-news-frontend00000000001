import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { authorsService, AuthorFormData } from '../../services/authors';
import { DragDropImageUpload } from '../../components/admin/DragDropImageUpload';
import { LazyImage } from '../../components/LazyImage';
import { Plus, Edit, Trash2, Search, User, Mail, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Author } from '../../types/api';

const authorSchema = z.object({
  name: z.string().min(2, 'Author name must be at least 2 characters'),
  role: z.string().min(2, 'Role must be at least 2 characters'),
  biography: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  title: z.string().optional(),
  professionalBackground: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  specialization: z.array(z.string()).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  socialMedia: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

type AuthorFormDataType = z.infer<typeof authorSchema>;

export const AdminAuthors: React.FC = () => {
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileImageData, setProfileImageData] = useState<any>(null);
  const [profileImageAlt, setProfileImageAlt] = useState('');
  const queryClient = useQueryClient();

  // Fetch authors
  const { data: authorsData, isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: authorsService.getAdminAuthors,
  });

  const authors = authorsData?.data.authors || [];

  // Filter authors based on search term
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form setup
  const form = useForm<AuthorFormDataType>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: '',
      role: '',
      biography: '',
      email: '',
      title: '',
      professionalBackground: '',
      expertise: [],
      specialization: [],
      location: '',
      phone: '',
      website: '',
      socialMedia: {
        twitter: '',
        facebook: '',
        instagram: '',
        linkedin: '',
      },
      isActive: true,
    },
  });

  // Create author mutation
  const createMutation = useMutation({
    mutationFn: (data: AuthorFormData) => authorsService.createAuthor(data),
    onSuccess: () => {
      toast.success('Author created successfully!');
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create author');
    },
  });

  // Update author mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AuthorFormData> }) =>
      authorsService.updateAuthor(id, data),
    onSuccess: () => {
      toast.success('Author updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update author');
    },
  });

  // Delete author mutation
  const deleteMutation = useMutation({
    mutationFn: authorsService.deleteAuthor,
    onSuccess: () => {
      toast.success('Author deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete author');
    },
  });

  // Toggle author status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: authorsService.toggleAuthorStatus,
    onSuccess: (response) => {
      toast.success(response.message || 'Author status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update author status');
    },
  });

  const resetForm = () => {
    setEditingAuthor(null);
    setProfileImageData(null);
    setProfileImageAlt('');
    form.reset({
      name: '',
      role: '',
      biography: '',
      email: '',
      title: '',
      professionalBackground: '',
      expertise: [],
      specialization: [],
      location: '',
      phone: '',
      website: '',
      socialMedia: {
        twitter: '',
        facebook: '',
        instagram: '',
        linkedin: '',
      },
      isActive: true,
    });
  };

  const handleSubmit = (data: AuthorFormDataType) => {
    const formData: AuthorFormData = {
      name: data.name,
      role: data.role,
      email: data.email,
      biography: data.biography,
      title: data.title,
      professionalBackground: data.professionalBackground,
      expertise: data.expertise?.filter(e => e.trim() !== ''),
      specialization: data.specialization?.filter(s => s.trim() !== ''),
      location: data.location,
      phone: data.phone,
      website: data.website || undefined,
      socialMedia: {
        twitter: data.socialMedia?.twitter || undefined,
        facebook: data.socialMedia?.facebook || undefined,
        instagram: data.socialMedia?.instagram || undefined,
        linkedin: data.socialMedia?.linkedin || undefined,
      },
      isActive: data.isActive,
      profileImage: profileImageData?.urls?.medium || undefined,
    };

    if (editingAuthor) {
      updateMutation.mutate({ id: editingAuthor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setProfileImageData(author.profileImage ? { urls: { medium: author.profileImage } } : null);
    setProfileImageAlt('Author profile photo');
    form.reset({
      name: author.name,
      role: author.role,
      biography: author.biography || '',
      email: author.email,
      title: author.title || '',
      professionalBackground: author.professionalBackground || '',
      expertise: author.expertise || [],
      specialization: author.specialization || [],
      location: author.location || '',
      phone: author.phone || '',
      website: author.website || '',
      socialMedia: {
        twitter: author.socialMedia?.twitter || '',
        facebook: author.socialMedia?.facebook || '',
        instagram: author.socialMedia?.instagram || '',
        linkedin: author.socialMedia?.linkedin || '',
      },
      isActive: author.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (authorId: string) => {
    if (window.confirm('Are you sure you want to delete this author? This action cannot be undone.')) {
      deleteMutation.mutate(authorId);
    }
  };

  const handleToggleStatus = (authorId: string) => {
    toggleStatusMutation.mutate(authorId);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleImageUploaded = (imageData: any) => {
    setProfileImageData(imageData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
          <p className="text-gray-600">Manage journalist profiles and editorial team</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Author
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAuthor ? 'Edit Author' : 'Create New Author'}
              </DialogTitle>
              <DialogDescription>
                {editingAuthor 
                  ? 'Update the author information below.'
                  : 'Add a new author to your editorial team.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Profile Image Upload */}
              <div>
                <Label className="text-base font-medium">Profile Image</Label>
                <div className="mt-2">
                  <DragDropImageUpload
                    onImageUploaded={handleImageUploaded}
                    currentImageUrl={profileImageData?.urls?.medium}
                    altText={profileImageAlt}
                    onAltTextChange={setProfileImageAlt}
                  />
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter author's full name..."
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="author@dominicanews.com"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role/Title *</Label>
                <Input
                  id="role"
                  placeholder="e.g., Senior Political Journalist, Feature Writer..."
                  {...form.register('role')}
                />
                {form.formState.errors.role && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Professional Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Editor, Chief Correspondent..."
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="biography">Biography</Label>
                <Textarea
                  id="biography"
                  placeholder="Enter author's biography and background..."
                  rows={3}
                  {...form.register('biography')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Brief biography for author profiles and bylines.
                </p>
                {form.formState.errors.biography && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.biography.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="professionalBackground">Professional Background</Label>
                <Textarea
                  id="professionalBackground"
                  placeholder="Detailed professional background, experience, education..."
                  rows={4}
                  {...form.register('professionalBackground')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Detailed background information for the Editorial Team page.
                </p>
                {form.formState.errors.professionalBackground && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.professionalBackground.message}
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Roseau, Dominica"
                    {...form.register('location')}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1-767-555-0000"
                    {...form.register('phone')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  {...form.register('website')}
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>

              {/* Social Media */}
              <div>
                <Label className="text-base font-medium">Social Media</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="@username"
                      {...form.register('socialMedia.twitter')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      placeholder="facebook.com/username"
                      {...form.register('socialMedia.facebook')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      {...form.register('socialMedia.instagram')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="linkedin.com/in/username"
                      {...form.register('socialMedia.linkedin')}
                    />
                  </div>
                </div>
              </div>

              {/* Expertise and Specialization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expertise">Areas of Expertise</Label>
                  <Input
                    id="expertise"
                    placeholder="e.g., Political Analysis, Investigative Journalism"
                    {...form.register('expertise')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list of expertise areas
                  </p>
                </div>
                <div>
                  <Label htmlFor="specialization">Specializations</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Politics, Sports, Business"
                    {...form.register('specialization')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list of coverage areas
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
                <Label htmlFor="isActive">Active Author</Label>
                <p className="text-xs text-gray-500">
                  Inactive authors won't appear in author selection or public pages
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingAuthor
                    ? 'Update Author'
                    : 'Create Author'
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredAuthors.length} of {authors.length} authors
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authors table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Editorial Team ({authors.length})
          </CardTitle>
          <CardDescription>
            Manage your editorial team and journalist profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAuthors.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm ? (
                <div>
                  <p className="text-gray-500 mb-4">No authors found matching "{searchTerm}"</p>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">No authors found</p>
                  <Button onClick={openCreateDialog}>Create your first author</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuthors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {author.profileImage ? (
                              <LazyImage
                                src={author.profileImage}
                                alt={`${author.name} profile`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{author.name}</p>
                            {author.title && (
                              <p className="text-sm text-blue-600">{author.title}</p>
                            )}
                            {author.specialization && author.specialization.length > 0 && (
                              <p className="text-xs text-gray-500">
                                {author.specialization.slice(0, 2).join(', ')}
                                {author.specialization.length > 2 && '...'}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{author.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{author.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{author.articlesCount || 0}</span>
                          <span className="text-gray-500 ml-1">articles</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={author.isActive ? "default" : "secondary"}>
                            {author.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(author.id)}
                            disabled={toggleStatusMutation.isPending}
                            className="text-xs"
                          >
                            {author.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(author.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(author)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(author.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};