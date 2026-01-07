import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  authorName: string;
  verificationUrl: string;
}

export function VerificationEmail({
  authorName,
  verificationUrl,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>メールアドレスを確認してください</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>購読を確認してください</Heading>
          <Text style={text}>
            {authorName} のニュースレターにご登録いただきありがとうございます。
          </Text>
          <Text style={text}>
            以下のボタンをクリックして、メールアドレスを確認してください。
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              メールアドレスを確認
            </Button>
          </Section>
          <Text style={footerText}>
            このメールに心当たりがない場合は、無視してください。
          </Text>
          <Text style={footerText}>
            SmartNews for Creators
          </Text>
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
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const buttonContainer = {
  padding: '27px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '0 40px',
};
