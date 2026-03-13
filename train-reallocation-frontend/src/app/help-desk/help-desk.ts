import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-help-desk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help-desk.html',
  styleUrls: ['./help-desk.css']
})

export class HelpDesk {

  question = '';
  language = 'en';

  messages: ChatMessage[] = [];

  /* MAIN CHAT FUNCTION */

  sendMessage(){

    if(!this.question.trim()) return;

    this.messages.push({
      sender:'user',
      text:this.question
    });

    const answer = this.getAIAnswer(this.question.toLowerCase());

    this.messages.push({
      sender:'ai',
      text:answer
    });

    this.speak(answer);

    this.question = '';

  }

  /* SMART AI LOGIC */

  getAIAnswer(q:string){

    if(q.includes("pnr")|| q.includes("reservation")){

      return this.translate({
        en:"You can check your PNR status on the PNR Status page of our Train Reallocation website.",
        hi:"आप हमारी वेबसाइट के PNR स्टेटस पेज पर अपना PNR चेक कर सकते हैं।",
         or:"ଆପଣ ଆମ ୱେବସାଇଟ୍‌ର PNR Status ପେଜରେ ଆପଣଙ୍କ PNR ଯାଞ୍ଚ କରିପାରିବେ।",
        bn:"আপনি আমাদের ওয়েবসাইটে PNR স্ট্যাটাস চেক করতে পারেন।"
      });

    }

    if(q.includes("cancel") || q.includes("cancelled")){

      return this.translate({
        en:"If your train is cancelled our system will automatically suggest alternate trains.",
        hi:"अगर आपकी ट्रेन रद्द हो जाती है तो सिस्टम वैकल्पिक ट्रेन सुझाएगा।",
         or:"ଆପଣ ଆମ ୱେବସାଇଟ୍‌ର PNR Status ପେଜରେ ଆପଣଙ୍କ PNR ଯାଞ୍ଚ କରିପାରିବେ।",
        bn:"আপনার ট্রেন বাতিল হলে সিস্টেম বিকল্প ট্রেন সাজেস্ট করবে।"
      });

    }

    if(q.includes("seat")){

      return this.translate({
        en:"Seats are automatically reallocated based on availability in our system.",
        hi:"हमारे सिस्टम में उपलब्धता के आधार पर सीटें स्वतः पुनः आवंटित होती हैं।",
         or:"ଆପଣ ଆମ ୱେବସାଇଟ୍‌ର PNR Status ପେଜରେ ଆପଣଙ୍କ PNR ଯାଞ୍ଚ କରିପାରିବେ।",
        bn:"উপলব্ধতার ভিত্তিতে আসন স্বয়ংক্রিয়ভাবে পুনর্বণ্টন করা হয়।"
      });

    }

    if(q.includes("delay") || q.includes("late") ||q.includes("running status")){

      return this.translate({
        en:"If your train is delayed you can check the latest status in the Train Status page.",
        hi:"अगर आपकी ट्रेन लेट है तो ट्रेन स्टेटस पेज पर अपडेट देख सकते हैं।",
         or:"ଆପଣ ଆମ ୱେବସାଇଟ୍‌ର PNR Status ପେଜରେ ଆପଣଙ୍କ PNR ଯାଞ୍ଚ କରିପାରିବେ।",
        bn:"ট্রেন দেরি হলে Train Status পেজে আপডেট দেখতে পারেন।"
      });

    }

    if(q.includes("ticket")|| q.includes("download ticket")){

      return this.translate({
        en:"You can download your ticket using the PNR number from the ticket page.",
        hi:"आप PNR नंबर का उपयोग करके टिकट डाउनलोड कर सकते हैं।",
         or:"ଆପଣ PNR ନମ୍ବର ବ୍ୟବହାର କରি ଟିକିଟ ଡାଉ୍ନ୍ଲୋଡ କରିପାରିବେ।",
        bn:"PNR নম্বর ব্যবহার করে টিকিট ডাউনলোড করতে পারেন।"
      });

    }

    if(q.includes("refund")){

      return this.translate({
        en:"Refund will be processed automatically if the train is cancelled.",
        hi:"अगर ट्रेन रद्द होती है तो रिफंड स्वतः प्रोसेस हो जाएगा।",
         or:"ଆପଣ ଆମ ୱେବସାଇଟ୍‌ର PNR Status ପେଜରେ ଆପଣଙ୍କ PNR ଯାଞ୍ଚ କରିପାରିବେ।",
        bn:"ট্রেন বাতিল হলে রিফান্ড স্বয়ংক্রিয়ভাবে হবে।"
      });

    }

    /* Default AI reply */

    return this.translate({
      en:"I can help with train status, PNR check, seat allocation, cancellations and refunds. Please ask your railway related question.",
      hi:"मैं ट्रेन स्टेटस, PNR, सीट आवंटन और रद्द ट्रेन के बारे में मदद कर सकता हूँ।",
       or:"ଆପଣ ଆମ ୱେବସାଇଟ୍‌ର PNR Status ପେଜରେ ଆପଣଙ୍କ PNR ଯାଞ୍ଚ କରିପାରିବେ।",
      bn:"ট্রেন স্ট্যাটাস, PNR, সিট এবং বাতিল সংক্রান্ত প্রশ্ন করতে পারেন।"
    });

  }

  /* LANGUAGE SYSTEM */

  translate(data:any){
    return data[this.language] || data['en'];
  }

  /* VOICE */

  speak(text:string){

    const speech = new SpeechSynthesisUtterance(text);

    const langs:any = {
      en:'en-IN',
      hi:'hi-IN',
      or:'or-IN',
      bn:'bn-IN'
    };

    speech.lang = langs[this.language] || 'en-IN';

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);

  }

}