import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Post {
  title: string;
  slug: string;
  thumbnail_url: string | null;
  genre: string | null;
  published_at: string;
}

interface NewsletterEmailProps {
  authorName: string;
  authorUsername: string;
  newsletterTitle: string;
  posts: Post[];
  unsubscribeUrl: string;
  baseUrl: string;
}

export function NewsletterEmail({
  authorName,
  authorUsername,
  newsletterTitle,
  posts,
  unsubscribeUrl,
  baseUrl,
}: NewsletterEmailProps) {
  const formattedDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Preview>{newsletterTitle} - {formattedDate}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{newsletterTitle}</Heading>
          <Text style={subtitle}>by {authorName}</Text>
          <Text style={date}>{formattedDate}</Text>

          <Hr style={hr} />

          {posts.map((post) => (
            <Section key={post.slug} style={postSection}>
              {post.thumbnail_url && (
                <Img
                  src={post.thumbnail_url}
                  alt={post.title}
                  style={postImage}
                />
              )}
              {post.genre && (
                <Text style={genre}>{post.genre}</Text>
              )}
              <Heading style={postTitle}>{post.title}</Heading>
              <Button
                style={button}
                href={`${baseUrl}/${authorUsername}/posts/${post.slug}`}
              >
                記事を読む
              </Button>
              <Hr style={postHr} />
            </Section>
          ))}

          <Section style={footer}>
            <Text style={footerText}>
              このメールは {authorName} のニュースレターに登録された方に送信されています。
            </Text>
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              購読を解除
            </Link>
            <Text style={footerText}>
              Media Tech Compass
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
};

const subtitle = {
  color: '#666',
  fontSize: '16px',
  textAlign: 'center' as const,
  margin: '0 0 10px',
};

const date = {
  color: '#999',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '0 0 30px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const postSection = {
  padding: '0 40px 20px',
};

const postImage = {
  width: '100%',
  height: 'auto',
  borderRadius: '8px',
  marginBottom: '16px',
};

const genre = {
  color: '#4f46e5',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const postTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  lineHeight: '1.4',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  margin: '0 0 20px',
};

const postHr = {
  borderColor: '#e6ebf1',
  margin: '30px 0',
};

const footer = {
  padding: '20px 40px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  margin: '10px 0',
};

const unsubscribeLink = {
  color: '#4f46e5',
  fontSize: '14px',
  textDecoration: 'underline',
  display: 'block',
  textAlign: 'center' as const,
  margin: '10px 0',
};
