'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Bot } from 'lucide-react';
import { ChatMessage, Product, Order } from '@/lib/types';
import { chatbotAPI, getChatSession, setChatSession, saveChatMessages, loadChatMessages } from '@/lib/api/chatbot';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useToast } from '@/components/ui/Toast';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ChatProductCard } from './ProductCard';
import { ChatOrderCard } from './OrderCard';
import { QuickActions } from './QuickActions';
import { Alert } from '@/components/ui/Alert';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  fullPage?: boolean;
}

export function ChatWindow({ isOpen, onClose, fullPage = false }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const toast = useToast();

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initialize session
  useEffect(() => {
    if (!isOpen) return;

    const initSession = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Try to get existing session
        let existingSessionId = getChatSession();
        
        if (!existingSessionId) {
          // Create new session
          const session = await chatbotAPI.createSession(
            isAuthenticated ? user?.id : undefined
          );
          existingSessionId = session.session_id;
          setChatSession(existingSessionId);
        }

        setSessionId(existingSessionId);

        // Load saved messages
        const savedMessages = loadChatMessages();
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Welcome message
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            type: 'bot',
            content: 'Xin chào! Tôi là chatbot của Bach Hoa Xanh. Tôi có thể giúp bạn:\n\n• Tìm kiếm sản phẩm\n• Xem đơn hàng\n• Tư vấn mua sắm\n• Hỗ trợ thanh toán\n\nBạn cần hỗ trợ gì hôm nay?',
            timestamp: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
          saveChatMessages([welcomeMessage]);
        }

        setIsInitializing(false);
      } catch (err: any) {
        console.error('Failed to initialize chat session:', err);
        setError('Không thể kết nối với chatbot. Vui lòng thử lại sau.');
        setIsInitializing(false);
      }
    };

    initSession();
  }, [isOpen, isAuthenticated, user?.id]);

  const handleSend = async (messageText: string) => {
    if (!sessionId || isTyping) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatMessages(updatedMessages);
    setIsTyping(true);
    setError(null);

    try {
      // Send to API
      const response = await chatbotAPI.sendMessage(
        sessionId,
        messageText,
        isAuthenticated ? user?.id : undefined
      );

      // Create bot response message
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: response.response || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.',
        timestamp: new Date().toISOString(),
      };

      // Add products if available
      if (response.products && response.products.length > 0) {
        botMessage.products = response.products;
        botMessage.messageType = 'product';
        // If only products, don't show text content (or show minimal)
        if (response.products.length > 0 && !response.response) {
          botMessage.content = `Tôi tìm thấy ${response.products.length} sản phẩm cho bạn:`;
        }
      }

      // Add orders if available
      if (response.orders && response.orders.length > 0) {
        botMessage.orders = response.orders;
        botMessage.messageType = 'order';
        // If only orders, adjust content
        if (response.orders.length > 0 && !response.response) {
          botMessage.content = `Bạn có ${response.orders.length} đơn hàng:`;
        }
      }

      // Add suggestions if available
      if (response.suggestions && response.suggestions.length > 0) {
        // Store suggestions for quick actions
        // They will be used in getQuickActions
      }

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      
      let errorContent = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
      
      // More specific error messages
      if (err.response?.status === 401) {
        errorContent = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.status === 429) {
        errorContent = 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi một chút rồi thử lại.';
      } else if (err.response?.status >= 500) {
        errorContent = 'Server đang gặp sự cố. Vui lòng thử lại sau.';
      } else if (!err.response) {
        errorContent = 'Không thể kết nối với server. Vui lòng kiểm tra kết nối internet.';
      }
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
      setError(errorContent);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(
      'Đã thêm vào giỏ hàng!',
      `1 ${product.unit} ${product.product_name}`,
      3000
    );
  };

  const getQuickActions = (): Array<{ label: string; action: () => void }> => {
    const actions = [];
    const lastMessage = messages[messages.length - 1];
    
    // Context-aware suggestions based on last bot message
    if (lastMessage?.type === 'bot') {
      // If bot showed products
      if (lastMessage.products && lastMessage.products.length > 0) {
        actions.push({
          label: 'Tìm sản phẩm khác',
          action: () => handleSend('Tôi muốn tìm sản phẩm khác'),
        });
        actions.push({
          label: 'Sản phẩm giá rẻ',
          action: () => handleSend('Tôi muốn xem sản phẩm giá rẻ'),
        });
      }
      
      // If bot showed orders
      if (lastMessage.orders && lastMessage.orders.length > 0) {
        actions.push({
          label: 'Theo dõi đơn hàng',
          action: () => handleSend('Tôi muốn theo dõi đơn hàng'),
        });
      }
    }

    // Always show common actions if no context-specific ones
    if (actions.length === 0) {
      actions.push({
        label: 'Xem sản phẩm',
        action: () => handleSend('Tôi muốn xem sản phẩm'),
      });
      
      if (isAuthenticated) {
        actions.push({
          label: 'Đơn hàng của tôi',
          action: () => handleSend('Tôi muốn xem đơn hàng của tôi'),
        });
      }
      
      actions.push({
        label: 'Hỗ trợ thanh toán',
        action: () => handleSend('Tôi cần hỗ trợ về thanh toán'),
      });
    }

    return actions;
  };

  if (!isOpen) return null;

  const containerClass = fullPage
    ? 'fixed inset-0 z-50 bg-white flex flex-col'
    : 'fixed bottom-20 right-4 w-full max-w-md h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h3 className="font-extrabold text-lg">Chat với AI</h3>
        </div>
        {!fullPage && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-green-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Đang kết nối...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === 'bot' && message.products && message.products.length > 0 ? (
                  <div className="mb-4">
                    <ChatMessageComponent message={message} />
                    <div className="mt-2 space-y-2">
                      {message.products.map((product) => (
                        <ChatProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  </div>
                ) : message.type === 'bot' && message.orders && message.orders.length > 0 ? (
                  <div className="mb-4">
                    <ChatMessageComponent message={message} />
                    <div className="mt-2 space-y-2">
                      {message.orders.map((order) => (
                        <ChatOrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <ChatMessageComponent message={message} />
                )}
              </div>
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4">
          <Alert variant="error" className="mb-2">
            {error}
          </Alert>
        </div>
      )}

      {/* Quick Actions */}
      {!isInitializing && !isTyping && messages.length > 0 && (
        <QuickActions actions={getQuickActions()} />
      )}

      {/* Input */}
      {!isInitializing && (
        <ChatInput onSend={handleSend} disabled={isTyping || !sessionId} />
      )}
    </div>
  );
}

